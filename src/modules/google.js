//
// GOOGLE API
//
(function(){

	// Format
	// Ensure each record contains a name, id etc.
	function formatItem(o){
		if(o.error){
			return;
		}
		if(!o.name){
			o.name = o.title || o.message;
		}
		if(!o.picture){
			o.picture = o.thumbnailLink;
		}
		if(!o.thumbnail){
			o.thumbnail = o.thumbnailLink;
		}
		if(o.mimeType === "application/vnd.google-apps.folder"){
			o.type = "folder";
			o.files = "https://www.googleapis.com/drive/v2/files?q=%22"+o.id+"%22+in+parents";
		}
	}

	// Google has a horrible JSON API
	function gEntry(o){

		var entry = function(a){
			var i=0, _a;
			var p = {
				id		: a.id.$t,
				name	: a.title.$t,
				description	: a.summary.$t,
				updated_time : a.updated.$t,
				created_time : a.published.$t,
				picture : a['media$group']['media$content'][0].url,
				thumbnail : a['media$group']['media$content'][0].url,
				width : a['media$group']['media$content'][0].width,
				height : a['media$group']['media$content'][0].height
//				original : a
			};
			// Get feed/children
			if("link" in a){
				for(i=0;i<a.link.length;i++){
					if(a.link[i].rel.match(/\#feed$/)){
						p.photos = a.link[i].href;
						p.files = a.link[i].href;
						p.upload_location = a.link[i].href;
						break;
					}
				}
			}

			// Get images of different scales
			if('category' in a&&a['category'].length){
				_a  = a['category'];
				for(i=0;i<_a.length;i++){
					if(_a[i].scheme&&_a[i].scheme.match(/\#kind$/)){
						p.type = _a[i].term.replace(/^.*?\#/,'');
					}
				}
			}

			// Get images of different scales
			if('media$thumbnail' in a['media$group']){
				_a = a['media$group']['media$thumbnail'];
				p.thumbnail = a['media$group']['media$thumbnail'][0].url;
				p.images = [];
				for(i=0;i<_a.length;i++){
					p.images.push({
						source : _a[i].url,
						width : _a[i].width,
						height : _a[i].height
					});
				}
				p.images.push({
					source : a['media$group']['media$content'][0].url,
					width : a['media$group']['media$content'][0].width,
					height : a['media$group']['media$content'][0].height
				});
			}
			return p;
		};

		var r = [];
		if("feed" in o && "entry" in o.feed){
			for(i=0;i<o.feed.entry.length;i++){
				r.push(entry(o.feed.entry[i]));
			}
			return {
				//name : o.feed.title.$t,
				//updated : o.feed.updated.$t,
				data : r
			};
		}

		// Old style, picasa, etc...
		if( "entry" in o ){
			return entry(o.entry);
		}else if( "items" in o ){
			for(var i=0;i<o.items.length;i++){
				formatItem( o.items[i] );
			}
			return {
				data : o.items
			};
		}
		else{
			formatItem( o );
			return o;
		}
	}



	//
	// Embed
	hello.init({
		google : {
			name : "Google Plus",
			uri : {
				// REF: http://code.google.com/apis/accounts/docs/OAuth2UserAgent.html
				auth : "https://accounts.google.com/o/oauth2/auth",
	//				me	: "plus/v1/people/me?pp=1",
				me : 'oauth2/v1/userinfo?alt=json',
				base : "https://www.googleapis.com/",
				'me/friends' : 'https://www.google.com/m8/feeds/contacts/default/full?alt=json&max-results=1000',
				'me/share' : 'plus/v1/people/me/activities/public',
				'me/feed' : 'plus/v1/people/me/activities/public',
				'me/albums' : 'https://picasaweb.google.com/data/feed/api/user/default?alt=json',
				'me/photos' : 'https://picasaweb.google.com/data/feed/api/user/default?alt=json&kind=photo&max-results=100',
				"me/files" : 'https://www.googleapis.com/drive/v2/files?q=%22root%22+in+parents'
			},
			scope : {
				//,
				basic : "https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
				email			: '',
				birthday		: '',
				events			: '',
				photos			: 'https://picasaweb.google.com/data/',
				videos			: 'http://gdata.youtube.com',
				friends			: 'https://www.google.com/m8/feeds',
				files			: 'https://www.googleapis.com/auth/drive.readonly',
				
				publish			: '',
				publish_files	: 'https://www.googleapis.com/auth/drive',
				create_event	: '',

				offline_access : ''
			},
			scope_delim : ' ',
			wrap : {
				me : function(o){
					if(o.id){
						o.last_name = o.family_name || o.name.familyName;
						o.first_name = o.given_name || o.name.givenName;
	//						o.name = o.first_name + ' ' + o.last_name;
						o.picture = o.picture || o.image.url;
						o.thumbnail = o.picture;
						o.name = o.displayName || o.name;
					}
					return o;
				},
				'me/friends'	: function(o){
					var r = [];
					if("feed" in o && "entry" in o.feed){
						for(var i=0;i<o.feed.entry.length;i++){
							var a = o.feed.entry[i];
							r.push({
								id		: a.id.$t,
								name	: a.title.$t,
								email	: (a.gd$email&&a.gd$email.length>0)?a.gd$email[0].address:null,
								updated_time : a.updated.$t,
								picture : (a.link&&a.link.length>0)?a.link[0].href+'?access_token='+hello.getAuthResponse('google').access_token:null,
								thumbnail : (a.link&&a.link.length>0)?a.link[0].href+'?access_token='+hello.getAuthResponse('google').access_token:null
							});
						}
						return {
							//name : o.feed.title.$t,
							//updated : o.feed.updated.$t,
							data : r
						};
					}
					return o;
				},
				'me/share' : function(o){
					o.data = o.items;
					try{
						delete o.items;
					}catch(e){
						o.items = null;
					}
					return o;
				},
				'me/feed' : function(o){
					o.data = o.items;
					try{
						delete o.items;
					}catch(e){
						o.items = null;
					}
					return o;
				},
				'me/albums' : gEntry,
				'me/photos' : gEntry,
				'default' : gEntry
			},
			xhr : function(p){
				if(p.method==='post'){
					return false;
				}
				return true;
			}
		}
	});
})();