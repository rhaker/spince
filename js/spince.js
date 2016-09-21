/*
*
* Originally created by Ross Haker (released on September 10, 2016)
* The logic on this page is as follows:
* 1) Determine if current page is on blacklist to stop execution
* 2) If not on blacklist, extract and validate the links on the page
* 3) Using the link text, determine the appropriate language
* 4) Analyze the text from each linked page and generate a score
*
*/

// detect the protocol
const PROTOCOL = window.location.protocol;

// settings in local storage
var storage = chrome.storage.local;

// check the website blacklist
storage.get('blacklist', function(items) {

    if (items.blacklist) {
 
		// get current blacklist
		var websitesList = items.blacklist;
	  
		// parse the blacklist
		websitesList = JSON.parse(websitesList);
		
		// check the type of the list			
		if (typeof(websitesList) === "string") {
		
			// parse the string at spaces
			var websites = websitesList.split(" ");
			
		} else {
		
			var websites = websitesList;
		
		}

		// check if the current website is blacklisted
		checkBlacklisted(websites);
		
    } else {

		// create original blacklist
		var newWebsites = ["*.gmail.com", "mail.google.com", "*.hotmail.com", "mail.yahoo.com", "*.outlook.com", "mail.yandex.com", "*.mail.com", "*.icloud.com", "*.fidelity.com", "*.tdameritrade.com", "*.etrade.com", "*.schwab.com", "*.scottrade.com", "*.amazon.com", "*.microsoft.com", "cloud.google.com", "*.digitalocean.com", "*.walmart.com", "*.netflix.com", "*.bankofamerica.com", "*.chase.com", "*.wellsfargo.com", "*.citi.com", "*.taobao.com", "*.ebay.com", "*.tmall.com", "*.paypal.com", "*.aliexpress.com"];
		
		// store the blacklist
		storage.set({'blacklist': JSON.stringify(newWebsites)}, function() {
			// save occurred, can send message in background
		});
		
		// get the hostname of the url to store
		let currentHostName = window.location.hostname.toString();

		// store the current hostname - retrieved to edit the blacklist
		storage.set({'currentHostName': currentHostName}, function() {
			// save occurred, can send message in background
		});
		
		// proceed to check managed links
		checkLinks();

	}
});
		
// a function to check whether to run the extension
function checkBlacklisted(websites) {

	// get the hostname of the url to check if excluded		
	let currentHostName = window.location.hostname.toString();

	// store the current hostname - retrieved to edit the blacklist
	storage.set({'currentHostName': currentHostName}, function() {
		// save occurred, can send message in background
	});

	// check if host name is included in blacklist	
	if (websites.indexOf(currentHostName) >= 0) {
		
		// stop - blacklisted website found, send message to change icon
		chrome.runtime.sendMessage({"message": "blacklistSite"});		
		
	} else {
		
		// no blacklisted website found, send message to change icon
		chrome.runtime.sendMessage({"message": "whitelistSite"});		
		
		// split the domain to check for universal match
		let splitHostName = currentHostName.split(".");
		
		if (splitHostName.length > 2) {			
		
			// check if universal hostname match exists
			let universalHostName = "*." + splitHostName[1] + "." + splitHostName[2];				
			
			if (websites.indexOf(universalHostName) >= 0) {
			
				// stop - blacklisted website found				
			
			} else {
			
				// proceed to check managed links
				checkLinks();
				
			}
			
		} else {
					
			// proceed to check managed links
			checkLinks();
			
		}
			
	}

}

// function to pull the excluded links
function checkLinks() {

	// check storage
	storage.get('excludedLinks', function(items) {

		 // pull current excluded link list from storage
		if (items.excludedLinks) {
	 
			// set the list
			let excluded = items.excludedLinks;							
			
			// parse the list
			let excludedList = JSON.parse(excluded);

			// check the list type
			if (typeof(excludedList) === "string") {
			
				// parse the string at spaces
				let excludedListArray = excludedList.split(" ");
				
				// proceed to link extraction
				extractLinks(excludedListArray);
				
			
			} else {
			
				// proceed to link extraction
				extractLinks(excludedList);
				
			}						
			
		} else {

			// set the array to empty
			let emptyArray = {};
			
			// list is empty, proceed to link extraction
			extractLinks(emptyArray);
								

		}
	});

}


// function to extract the link text
function extractLinks(excludedLinks) {

	let hrefHttpArrayA = [];
	let hrefHttpArrayR = [];
	let hrefHttpsArrayA = [];
	let hrefHttpsArrayR = [];
	let textHttpArray = [];	
	let textHttpsArray = [];	
	
	$("a").each(function(){
    
		let hrefValA = $(this).prop("href"); // absolute url
		let hrefValR = $(this).attr("href");
		let textVal = $(this).text();		
		let isBadProtocol = "yes";				
		let linkProtocol = "http://";
		let isTextPage = "no";

		// check that both href and text exists and exclude linked images (text only)
		if ((hrefValA && hrefValR && textVal) && (textVal.indexOf("<img") === -1)) {

			let textValTrim = textVal.trim();
			let spaceCount = (textValTrim.match(/\s/g) || []).length;					

			// check for either http or https protocol
			if (("http://" === hrefValA.toLowerCase().substr(0, 7)) || ("https://" === hrefValA.toLowerCase().substr(0, 8))) {	

				// set the bad protocol flag to no
				isBadProtocol = "no";
									
				// remove the protocol
				let urlArray = hrefValA.split('://');
				let urlEnd = urlArray[1];
											
				// set the protocol
				linkProtocol = urlArray[0] + '://';

				// check if no path - just the root domain				
				if (urlEnd.indexOf("/") === -1)  {

					// the page has no extension, default to text
					isTextPage = "yes";
					var urlHostName = urlEnd;
					
				} else {
				
					// split off the hostname to compare excluded links (hostname only)
					var urlHostNameArray = urlEnd.split('/');
					var urlHostName = urlHostNameArray[0];
					
				}
		
				// remove the anchor at the end, if there is one
				urlEnd = urlEnd.substring(0, (urlEnd.indexOf("#") === -1) ? urlEnd.length : urlEnd.indexOf("#"));
				
				// remove the query after the file name, if there is one
				urlEnd = urlEnd.substring(0, (urlEnd.indexOf("?") === -1) ? urlEnd.length : urlEnd.indexOf("?"));
											
				// remove everything before the last slash in the path
				urlEnd = urlEnd.substring(urlEnd.lastIndexOf("/") + 1, urlEnd.length);

				let fileExtensions = ['html', 'htm', 'php', 'asp', 'asc', 'csv', 'txt', 'xml', 'rdf', 'text', 'rtf', 'plist', 'yml', 'md', 'report', 'html5', 'rt', 'dat', 'readme', 'soap', 'desc', 'markdown', 'ttxt', 'me', 'htmls', 'ht3', 'tab', 'xhtm'];
				
				// check that the page is primarily text based
				if (urlEnd.indexOf(".") == -1)  {

					// the page has no extension, default to text
					isTextPage = "yes";

				} else {

					// remove everything before the last . in the path				
					urlEnd = urlEnd.substring(urlEnd.lastIndexOf(".") + 1, urlEnd.length);

					// check if the extension is on the text whitelist				
					if (fileExtensions.indexOf(urlEnd) >= 0) {

						// the page is a text page
						isTextPage = "yes";

					}
					
				}			

			}		

			// only pull links that have a certain text link type
			if ((isBadProtocol === "no") && (isTextPage === "yes")) {

				// if link is under the small text limit, show nothing	
				if ((textVal.length < 25) || (spaceCount < 3)) {
				
					// do nothing
					
				// if link is under the bigger text limit, show dash		
				} else if ((textVal.length < 32) || (spaceCount < 3)) {
							
					$(this).append("-");											
									
				// check if link is on the excluded link list
				} else if (excludedLinks.length >= 0) {

					if (excludedLinks.indexOf(urlHostName) >= 0) {
					
						// set the link display to show dash			
						var imagePath = chrome.extension.getURL('/img/dash.png');
																	 						
						// insert the dash image
						$(this).after("<img style='height:7px;width:7px' alt='Link is on excluded list.' src='" + imagePath + "' />");																								
					}
					
				} else {																

					// add links to array based on the protocol
					if (linkProtocol === "http://") {
					
						// push to array
						hrefHttpArrayA.push(hrefValA);	
						hrefHttpArrayR.push(hrefValR);	
						textHttpArray.push(textVal);
						
					}
					
					// add links to array based on the protocol
					if (linkProtocol === "https://") {
					
						// push to array
						hrefHttpsArrayA.push(hrefValA);	
						hrefHttpsArrayR.push(hrefValR);	
						textHttpsArray.push(textVal);
						
					}
					
				}
							
			}
						
		}
		
    });

	// if there is a link, detect language
	if (textHttpArray && hrefHttpArrayA && (textHttpArray.length > 0)) {
		
		// use the first link text to detect the language
		detectLang(textHttpArray[0],hrefHttpArrayA,hrefHttpArrayR,textHttpArray,hrefHttpsArrayA,hrefHttpsArrayR,textHttpsArray);			
		
	} else if (textHttpsArray && hrefHttpsArrayA && (textHttpsArray.length > 0)) {
				
		// use the first link text to detect the language
		detectLang(textHttpsArray[0],hrefHttpArrayA,hrefHttpArrayR,textHttpArray,hrefHttpsArrayA,hrefHttpsArrayR,textHttpsArray);
			
	}

}

// function to detect the language
function detectLang(linkText,hrefHttpArrayA,hrefHttpArrayR,textHttpArray,hrefHttpsArrayA,hrefHttpsArrayR,textHttpsArray) {

	// detect the language - assume linked pages are in same language as current page
	chrome.i18n.detectLanguage(linkText, function(result) {
			
		// default to en (english)
		var currentLanguage = "en";
		
		// check if there are  any results
		if (result.languages.length > 0) {        
			
			// pull the first detected language
			currentLanguage = result.languages[0].language;
			
			// check if the result is reliable
			if (result.isReliable) {
			
				// do nothing
			
			} else {
			
				// default back to english if unreliable
				currentLanguage = "en";
			
			}
			   
		}
		
		// english list of words which are ignored when computing top relevant sentences.
		const stopWordsEn = [
			'', 'a', 'about', 'above', 'above', 'across', 'after', 'afterwards', 'again', 'against', 'all', 'almost', 'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'among', 'amongst', 'amoungst', 'amount', 'an', 'and', 'another', 'any', 'anyhow', 'anyone', 'anything', 'anyway', 'anywhere', 'are', 'around', 'as', 'at', 'back', 'be', 'became', 'because', 'become', 'becomes', 'becoming', 'been', 'before', 'beforehand', 'behind', 'being', 'below', 'beside', 'besides', 'between', 'beyond', 'bill', 'both', 'bottom', 'but', 'by', 'call', 'can', 'cannot', 'cant', 'co', 'con', 'could', 'couldnt', 'cry', 'de', 'describe', 'detail', 'do', 'done', 'down', 'due', 'during', 'each', 'eg', 'eight', 'either', 'eleven', 'else', 'elsewhere', 'empty', 'enough', 'etc', 'even', 'ever', 'every', 'everyone', 'everything', 'everywhere', 'except', 'few', 'fifteen', 'fifty', 'fill', 'find', 'fire', 'first', 'five', 'for', 'former', 'formerly', 'forty', 'found', 'four', 'from', 'front', 'full', 'further', 'get', 'give', 'go', 'had', 'has', 'hasnt', 'have', 'he', 'hence', 'her', 'here', 'hereafter', 'hereby', 'herein', 'hereupon', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'however', 'hundred', 'ie', 'if', 'in', 'inc', 'indeed', 'interest', 'into', 'is', 'it', 'its', 'itself', 'keep', 'last', 'latter', 'latterly', 'least', 'less', 'ltd', 'made', 'many', 'may', 'me', 'meanwhile', 'might', 'mill', 'mine', 'more', 'moreover', 'most', 'mostly', 'move', 'much', 'must', 'my', 'myself', 'name', 'namely', 'neither', 'never', 'nevertheless', 'next', 'nine', 'no', 'nobody', 'none', 'noone', 'nor', 'not', 'nothing', 'now', 'nowhere', 'of', 'off', 'often', 'on', 'once', 'one', 'only', 'onto', 'or', 'other', 'others', 'otherwise', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'part', 'per', 'perhaps', 'please', 'put', 'rather', 're', 'really', 'same', 'see', 'seem', 'seemed', 'seeming', 'seems', 'serious', 'several', 'she', 'should', 'show', 'side', 'since', 'sincere', 'six', 'sixty', 'so', 'some', 'somehow', 'someone', 'something', 'sometime', 'sometimes', 'somewhere', 'still', 'such', 'system', 'take', 'ten', 'than', 'that', 'the', 'their', 'them', 'themselves', 'then', 'thence', 'there', 'thereafter', 'thereby', 'therefore', 'therein', 'thereupon', 'these', 'they', 'thickv', 'thin', 'third', 'this', 'those', 'though', 'three', 'through', 'throughout', 'thru', 'thus', 'to', 'together', 'too', 'top', 'toward', 'towards', 'twelve', 'twenty', 'two', 'un', 'under', 'until', 'up', 'upon', 'us', 'very', 'via', 'was', 'we', 'well', 'were', 'what', 'whatever', 'when', 'whence', 'whenever', 'where', 'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon', 'wherever', 'whether', 'which', 'while', 'whither', 'who', 'whoever', 'whole', 'whom', 'whose', 'why', 'will', 'with', 'within', 'without', 'would', 'yet', 'you', 'your', 'yours', 'yourself', 'yourselves', 'the'
		];

		// german list of words which are ignored when computing top relevant sentences.		
		const stopWordsDe = [
			'', 'aber', 'alle', 'allem', 'allen', 'aller', 'alles', 'als', 'also', 'am', 'an', 'ander', 'andere', 'anderem', 'anderen', 'anderer', 'anderes', 'anderm', 'andern', 'anderr', 'anders', 'auch', 'auf', 'aus', 'bei', 'bin', 'bis', 'bist', 'da', 'dadurch', 'daher', 'damit', 'dann', 'darum', 'das', 'dass', 'dasselbe', 'dazu', 'daß', 'dein', 'deine', 'deinem', 'deinen', 'deiner', 'deines', 'dem', 'demselben', 'den', 'denn', 'denselben', 'der', 'derer', 'derselbe', 'derselben', 'des', 'deshalb', 'desselben', 'dessen', 'dich', 'die', 'dies', 'diese', 'dieselbe', 'dieselben', 'diesem', 'diesen', 'dieser', 'dieses', 'dir', 'doch', 'dort', 'du', 'durch', 'ein', 'eine', 'einem', 'einen', 'einer', 'eines', 'einig', 'einige', 'einigem', 'einigen', 'einiger', 'einiges', 'einmal', 'er', 'es', 'etwas', 'euch', 'euer', 'eure', 'eurem', 'euren', 'eurer', 'eures', 'für', 'gegen', 'gewesen', 'hab', 'habe', 'haben', 'hat', 'hatte', 'hatten', 'hattest', 'hattet', 'hier', 'hin', 'hinter', 'ich', 'ihm', 'ihn', 'ihnen', 'ihr', 'ihre', 'ihrem', 'ihren', 'ihrer', 'ihres', 'im', 'in', 'indem', 'ins', 'ist', 'ja', 'jede', 'jedem', 'jeden', 'jeder', 'jedes', 'jene', 'jenem', 'jenen', 'jener', 'jenes', 'jetzt', 'kann', 'kannst', 'kein', 'keine', 'keinem', 'keinen', 'keiner', 'keines', 'können', 'könnt', 'könnte', 'machen', 'man', 'manche', 'manchem', 'manchen', 'mancher', 'manches', 'mein', 'meine', 'meinem', 'meinen', 'meiner', 'meines', 'mich', 'mir', 'mit', 'muss', 'musst', 'musste', 'muß', 'mußt', 'müssen', 'müßt', 'nach', 'nachdem', 'nein', 'nicht', 'nichts', 'noch', 'nun', 'nur', 'ob', 'oder', 'ohne', 'sehr', 'seid', 'sein', 'seine', 'seinem', 'seinen', 'seiner', 'seines', 'selbst', 'sich', 'sie', 'sind', 'so', 'solche', 'solchem', 'solchen', 'solcher', 'solches', 'soll', 'sollen', 'sollst', 'sollt', 'sollte', 'sondern', 'sonst', 'soweit', 'sowie', 'um', 'und', 'uns', 'unse', 'unsem', 'unsen', 'unser', 'unsere', 'unses', 'unter', 'viel', 'vom', 'von', 'vor', 'wann', 'war', 'waren', 'warst', 'warum', 'was', 'weg', 'weil', 'weiter', 'weitere', 'welche', 'welchem', 'welchen', 'welcher', 'welches', 'wenn', 'wer', 'werde', 'werden', 'werdet', 'weshalb', 'wie', 'wieder', 'wieso', 'will', 'wir', 'wird', 'wirst', 'wo', 'woher', 'wohin', 'wollen', 'wollte', 'während', 'würde', 'würden', 'zu', 'zum', 'zur', 'zwar', 'zwischen', 'über'
		];

		// spanish list of words which are ignored when computing top relevant sentences.		
		const stopWordsEs = [
			'', 'a', 'un', 'una', 'unas', 'unos', 'uno', 'sobre', 'de', 'todo', 'también', 'tras', 'otro', 'algún', 'alguno', 'alguna', 'algunos', 'algunas', 'ser', 'es', 'soy', 'eres', 'somos', 'sois', 'esto', 'estoy', 'esta', 'estamos', 'estais', 'estan', 'como', 'en', 'para', 'atras', 'porque', 'por qué', 'estado', 'estaba', 'ante', 'antes', 'siendo', 'ambos', 'pero', 'por', 'no', 'poder', 'sal', 'al', 'puede', 'puedo', 'más', 'ya', 'le', 'o', 'me', 'hasta', 'durante', 'ni', 'ese', 'contra', 'eso', 'mí', 'mi', 'el', 'él', 'podemos', 'podeis', 'pueden', 'fui', 'fue', 'fuimos', 'fueron', 'hacer', 'hago', 'hace', 'hacemos', 'haceis', 'hacen', 'cada', 'fin', 'incluso', 'primero', 'desde', 'conseguir', 'consigo', 'consigue', 'consigues', 'conseguimos', 'consiguen', 'ir', 'voy', 'va', 'vamos', 'vais', 'van', 'vaya', 'gueno', 'ha', 'tener', 'tengo', 'tiene', 'tenemos', 'teneis', 'tienen', 'la', 'lo', 'las', 'los', 'su', 'aqui', 'mio', 'poco', 'tu', 'tú', 'te', 'si', 'sí', 'tuyo', 'ellos', 'ella', 'y', 'del', 'se', 'ellas', 'nos', 'nosotros', 'vosotros', 'vosotras', 'si', 'dentro', 'solo', 'solamente', 'saber', 'sabes', 'sabe', 'sabemos', 'sabeis', 'saben', 'ultimo', 'largo', 'bastante', 'haces', 'muchos', 'aquellos', 'aquellas', 'sus', 'entonces', 'tiempo', 'verdad', 'verdadero', 'verdadera', 'cierto', 'ciertos', 'cierta', 'ciertas', 'intentar', 'intento', 'intenta', 'intentas', 'intentamos', 'intentais', 'intentan', 'dos', 'bajo', 'arriba', 'encima', 'usar', 'uso', 'usas', 'usa', 'usamos', 'usais', 'usan', 'emplear', 'empleo', 'empleas', 'emplean', 'ampleamos', 'empleais', 'valor', 'muy', 'era', 'eras', 'eramos', 'eran', 'modo', 'bien', 'cual', 'cuando', 'donde', 'mientras', 'quien', 'con', 'entre', 'sin', 'trabajo', 'trabajar', 'trabajas', 'trabaja', 'trabajamos', 'trabajais', 'trabajan', 'podria', 'podrias', 'podriamos', 'podrian', 'podriais', 'yo', 'aquel', 'que', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
		];
		
		// french list of words which are ignored when computing top relevant sentences.		
		const stopWordsFr = [
			'', 'alors', 'au', 'aucuns', 'aussi', 'autre', 'avant', 'avec', 'avoir', 'bon', 'car', 'ce', 'cela', 'ces', 'ceux', 'chaque', 'ci', 'comme', 'comment', 'dans', 'des', 'du', 'dedans', 'dehors', 'depuis', 'devrait', 'doit', 'donc', 'dos', 'début', 'elle', 'elles', 'en', 'encore', 'essai', 'est', 'et', 'eu', 'fait', 'faites', 'fois', 'font', 'hors', 'ici', 'il', 'ils', 'je', 'juste', 'la', 'le', 'les', 'leur', 'là ', 'ma', 'maintenant', 'mais', 'mes', 'mine', 'moins', 'mon', 'mot', 'même', 'ni', 'nommés', 'notre', 'nous', 'ou', 'ooù', 'par', 'parce', 'pas', 'peut', 'peu', 'plupart', 'pour', 'pourquoi', 'quand', 'que', 'quel', 'quelle', 'quelles', 'quels', 'qui', 'sa', 'sans', 'ses', 'seulement', 'si', 'sien', 'son', 'sont', 'sous', 'soyez', 'sujet', 'sur', 'ta', 'tandis', 'tellement', 'tels', 'tes', 'ton', 'tous', 'tout', 'trop', 'très', 'tu', 'voient', 'vont', 'votre', 'vous', 'vu', 'ça', 'étaient', 'état', 'étions', 'été', 'être'
		];
		
		// italian list of words which are ignored when computing top relevant sentences.		
		const stopWordsIt = [
			'', 'a', 'adesso', 'ai', 'al', 'alla', 'allo', 'allora', 'altre', 'altri', 'altro', 'anche', 'ancora', 'avere', 'aveva', 'avevano', 'ben', 'buono', 'che', 'chi', 'cinque', 'comprare', 'con', 'consecutivi', 'consecutivo', 'cosa', 'cui', 'da', 'del', 'della', 'dello', 'dentro', 'deve', 'devo', 'di', 'doppio', 'due', 'e', 'ecco', 'fare', 'fine', 'fino', 'fra', 'gente', 'giu', 'ha', 'hai', 'hanno', 'ho', 'il', 'indietro', 'invece', 'io', 'la', 'lavoro', 'le', 'lei', 'lo', 'loro', 'lui', 'lungo', 'ma', 'me', 'meglio', 'molta', 'molti', 'molto', 'nei', 'nella', 'no', 'noi', 'nome', 'nostro', 'nove', 'nuovi', 'nuovo', 'o', 'oltre', 'ora', 'otto', 'peggio', 'pero', 'persone', 'piu', 'poco', 'primo', 'promesso', 'qua', 'quarto', 'quasi', 'quattro', 'quello', 'questo', 'qui', 'quindi', 'quinto', 'rispetto', 'sara', 'secondo', 'sei', 'sembra', 'sembrava', 'senza', 'sette', 'sia', 'siamo', 'siete', 'solo', 'sono', 'sopra', 'soprattutto', 'sotto', 'stati', 'stato', 'stesso', 'su', 'subito', 'sul', 'sulla', 'tanto', 'te', 'tempo', 'terzo', 'tra', 'tre', 'triplo', 'ultimo', 'un', 'una', 'uno', 'va', 'vai', 'voi', 'volte', 'vostro'
		];
		
		// use the language to set the stop words	
		var stopWords = stopWordsEn;
		
		if (currentLanguage === "de") {
			stopWords = stopWordsDe;
		} else if (currentLanguage === "es") {
			stopWords = stopWordsEs;
		} else if (currentLanguage === "fr") {
			stopWords = stopWordsFr;
		} else if (currentLanguage === "it") {
			stopWords = stopWordsIt;
		}	
		
		startAjaxProcess(stopWords,hrefHttpArrayA,hrefHttpArrayR,textHttpArray,hrefHttpsArrayA,hrefHttpsArrayR,textHttpsArray);
		
	});

}


// function to perform the ajax and receive text response
function startAjaxProcess(stopWords,hrefHttpArrayA,hrefHttpArrayR,textHttpArray,hrefHttpsArrayA,hrefHttpsArrayR,textHttpsArray) {

	let hrefArrayA = [];
	let hrefArrayR = [];
	let textArray = [];
	let hrefLaterArrayA = [];
	let hrefLaterArrayR = [];
	let textLaterArray = [];

	// set the current protocol to ajax within script
	if (PROTOCOL === "http:") {
	
		// ajax the http links first
		hrefArrayA = hrefHttpArrayA;
		hrefArrayR = hrefHttpArrayR;
		textArray = textHttpArray;
		hrefLaterArrayA = hrefHttpsArrayA;
		hrefLaterArrayR = hrefHttpsArrayR;
		textLaterArray = textHttpsArray;
		
		
	} else {
	
		// ajax the https links first
		hrefArrayA = hrefHttpsArrayA;
		hrefArrayR = hrefHttpsArrayR;
		textArray = textHttpsArray;
		hrefLaterArrayA = hrefHttpArrayA;
		hrefLaterArrayR = hrefHttpArrayR;
		textLaterArray = textHttpArray;
	
	}

	let linkNo = 0;
	
	// send the first link
	if (hrefArrayR.length > 0 ) {

		ajaxProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);
		
	} else {
	
		// no links with same protocol
		startBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);
		
	}
	
}

// a function to retrieve the data as text
function ajaxProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo) {

	// check that a link exists
	if ((linkNo >= hrefArrayR.length) && (hrefArrayR.length > 0)) {	

		// no more links with same protocol
		startBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);

	} else {

		// set the link display to show loading			
		var imagePath = chrome.extension.getURL('/img/blue.gif');

		// find the anchor that matches the href
		$("a[href='" + hrefArrayR[linkNo] + "']").each(function () {

			// check if the link text matches
			if ($(this).text() === textArray[linkNo]) {

				// insert the loading spinner
				$(this).append("&nbsp;<img src='" + imagePath + "' style='height:7px;width:7px' />");
			
			}
			
		});		
				
		// get text response - using returned dataType as text (response isn't evaluated)
		$.ajax({
			url: hrefArrayA[linkNo],
			cache: false,
			dataType: 'text',
			success: function (response) {
				// clean the corpus								
				cleanCorpus(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo,response,"no")
			},
			error: function (xhr, ajaxOptions, thrownError){
											
				// find the anchor that matches the href
				$("a[href='" + hrefArrayR[linkNo] + "']").each(function () {
							 
					// check if the link text matches
					if ($(this).text() === textArray[linkNo]) {
						
						// delete the loading spinner
						$(this).html( textArray[linkNo]);
						
						// change to dash
						$(this).append("-");											
					
					}
					
				});
				
				// move to next link
				linkNo = linkNo + 1;
				ajaxProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);
				
			}        
		});

	}
	
}

function cleanCorpus(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo,response,backFlag) {

	// pull the text from the p's - ignore any text not within a <p></p>
	let pText = response;

	// make sure all p's are lowercase for string extraction
	pText = response.replace(/P>/g, 'p>');

	// split into p's leading fragments - assumes no nested p's inside of p's
	let firstSplit = pText.split("<p>");

	let secondSplit = [];
	let pCurrent = "";
	let pArray = [];

	// cycle through fragments and get string before </p>, start at first <p> filtering off beginning
	for (var j = 1; j < firstSplit.length; j++) {

		// split into </p>
		secondSplit = firstSplit[j].split("</p>");
		
		if (secondSplit.length > 0) {
		
			// trim the p
			pCurrent = secondSplit[0].trim();
			
			// remove line breaks and carriage returns
			pCurrent = pCurrent.replace(/(\r\n|\n|\r)/gm, " ");
			pCurrent = pCurrent.replace(/[\n\r]/g, ' ');
			
			// push p onto array
			pArray.push(pCurrent);
			
		}
		
	}
		
	// validate p's exist
	if (pArray.length > 0) {

		// reset the pText
		pText = '';
		
		// cycle through and concatenate p's
		for (var i = 0; i < pArray.length; i++) {
		
			// add a space between p's
			pText = pText.trim() + " " + pArray[i];
			
		}
		
		// process the summary score
		scoreProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo,pText,backFlag);					

	} else {

		let linkText = "";
		let linkHref = "";
		
		// set the variables based on protocol vs non-protocol link type
		if (backFlag === "yes") {	
		
			linkText = textLaterArray[linkNo];
			linkHref = hrefLaterArrayR[linkNo];
			
		} else {
		
			linkText = textArray[linkNo];
			linkHref = hrefArrayR[linkNo];
			
		}	
				
		// find the anchor that matches the href
		$("a[href='" + linkHref + "']").each(function () {
					 
			// check if the link text matches
			if ($(this).text().trim() == linkText.trim()) {
				
				// delete the loading				
				$(this).html( linkText );
										
				// change to dash
				$(this).append("-");											
			
			}
			
		});

		// move to next link		
		linkNo = linkNo + 1;
		
		if (backFlag === "yes") {
	
			sendBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);				
			
		} else {
		
			ajaxProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);
		}
		
	}
					
}

// function to generate a score
function scoreProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo,pText,backFlag) {

	// set delimiters and stop words
	const sentenceDelimiter = /[.!?;]/;
	const matchJunk = /["”“#$%&'’()*+,\-\/:<=>@\[\\\]\^_`{|}]/mg ;

	// set the clean functions
	let unescapeHTML = str => str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
	let stripTags= str => str.replace(/<\/?[^>]+>/ig, '');
	let stripClean = str => str.trim((str.replace(/\s+/g, ' ')));
	let stripJunk = str => str.replace(matchJunk, '' );
	let goLower = str => str.toLowerCase();

	// chain the specific clean operations
	let cleanFunc = str =>  {
		
		// perform the various clean operations
		var returnStr = unescapeHTML(str);
		returnStr = stripTags(returnStr);
		returnStr = stripClean(returnStr);
		returnStr = stripJunk(returnStr);
		returnStr = goLower(returnStr);
		return returnStr;
		
	}

	// clean the corpus for word analysis		
	let cleanText = cleanFunc(pText);		
			
	// split cleaned corpus into words
	let wordArray = cleanText.split(' ');

	// map the frequency of each word in the corpus
	let wordFreq = new Map([...new Set(wordArray)].map(
		x => [x, wordArray.filter(y => y === x).length]
	));

	// split the corpus into raw sentences
	let sentences = pText.split(sentenceDelimiter);

	// create variables to calculate the score for each sentence
	let sentenceCount = sentences.length;
	let sentenceScoreArray = [];
	let returnArray = [];
	let sentenceScore = 0;
	let sentenceWords = [];
	let cleanSentence = "";
	let sentenceLength = 0;
	let currentMaxSentence = 0;
	let currentMaxScore = 0;

	// create a sentence score function
	let scoreFunc = str =>  {
		
		// split the actual sentence into words
		let sentWords = str.split(" ");
		
		// count the length of the sentence
		let sentLength = sentWords.length;
		
		// reset the sentenceScore 
		let sentScore = 0;
		
		// cycle through word by word
		for (var j = 0; j < sentLength; j++) {

			// skip if word is a stop word
			if (stopWords.indexOf( sentWords[j] ) === -1) {           
				
				// get the frequency of the word in the document and add to score
				if (wordFreq.get(sentWords[j]) > 0 ) {
					sentScore = sentScore + wordFreq.get(sentWords[j]);	
				}
				
			}
			
		}
		
		return [sentScore, sentLength];
		
	}

	// cycle through each sentence to calculate a score
	for (var i = 0; i < sentenceCount; i++) {

		// clean the sentence
		cleanSentence = cleanFunc(sentences[i]);
		
		// trim the sentence 
		cleanSentence = cleanSentence.trim();

		// get the calculation return values
		returnArray = scoreFunc(cleanSentence);
		
		// calculate the score		
		sentenceScore = returnArray[0];
		
		// scale the score based on position - top of page is more relevant
		sentenceScore = sentenceScore * ((sentenceCount - i) / (sentenceCount));
		
		// scale the score if it includes any tags				
		if ((sentences[i].match(/<\/?[^>]+>/ig) || []).length > 0 ) {
			sentenceScore = sentenceScore * .1;
		}
		
		// scale the score if it includes any special characters				
		if ((sentences[i].match(/["”“#$%&'’()*+,\-\/:=@\[\\\]\^_`{|}]/mg) || []).length > 0 ) {
			sentenceScore = sentenceScore * .5;
		}
		
		// scale the score if sentence starts with lowercase letter
		let first = sentences[i].charAt(0);
		
		if ((first === first.toLowerCase()) && (first !== first.toUpperCase())) {
			sentenceScore = sentenceScore * .1;
		}
		
		// calculate the sentence length
		sentenceLength = returnArray[1];
			
		// normalize total score by sentence length (including stop words)
		if (sentenceLength > 30 ) {
			sentenceScore = sentenceScore * .2;
		} else if (sentenceLength > 20) {	
			sentenceScore = sentenceScore * .25;
		} else if (sentenceLength > 13) {
			sentenceScore = sentenceScore * .45;
		} else if (sentenceLength > 7) {
			sentenceScore = sentenceScore * .6;
		} else if (sentenceLength > 4) {
			sentenceScore = sentenceScore * .7;
		}

		// add score to array
		sentenceScoreArray.push(sentenceScore);	
		
		// check if current max
		if (sentenceScore > currentMaxScore) {
			currentMaxScore = sentenceScore;
			currentMaxSentence = i;
		}
		
	}	
		
	// clean the actual link text
	let linkText = "";
	let linkHref = "";
	
	if (backFlag === "yes") {	
		linkText = textLaterArray[linkNo];
		linkHref = hrefLaterArrayR[linkNo];
	} else {
		linkText = textArray[linkNo];
		linkHref = hrefArrayR[linkNo];
	}	

	let linkTextArray = cleanFunc(linkText);
	
	// get the score of the link text	
	let linkScoreArray = scoreFunc(linkTextArray);	

	// normalize the score for its word length
	if (linkScoreArray[1] > 10) {
		linkScoreArray[0] = linkScoreArray[0] * .2;
	} else if (sentenceLength > 6) {
		linkScoreArray[0] = linkScoreArray[0] * .35;
	} else if (sentenceLength > 3) {
		linkScoreArray[0] = linkScoreArray[0] * .45;
	} else {
		linkScoreArray[0] = linkScoreArray[0] * .65;
	}
	
	// set the jBox tooltips
	$('.sTooltip').jBox('Tooltip', {
		getTitle: 'data-jbox-title',
		getContent: 'data-jbox-content',		
		theme: 'TooltipDark',	
		trigger: 'click',			
		closeOnClick: true,
	});
		
	// change link display
	let imagePath = chrome.extension.getURL('/img/green.png');	

	// text clean holdersu
	let cleanLinkTextInsert = "";
	let cleanSentenceInsert = "";

	// check if link score is greater than 50 percent of best
	if (linkScoreArray[0] > currentMaxScore * 0.5) {

		// find the anchor that matches the href
		$("a[href='" + linkHref + "']").each(function () {

			// check if the link text matches
			if ($(this).text().trim() === linkText.trim())  {

				// clean the text
				cleanLinkTextInsert = unescapeHTML(linkText);
				cleanLinkTextInsert = stripTags(cleanLinkTextInsert);
				cleanSentenceInsert = unescapeHTML(sentences[currentMaxSentence]);
				cleanSentenceInsert = stripTags(cleanSentenceInsert);
				cleanSentenceInsert = stripJunk(cleanSentenceInsert);
		
				// delete the loading				
				$(this).html( cleanLinkTextInsert );								

				// insert the tooltip and green circle - use empty onclick for touch screens								
				$(this).after("&nbsp;<span class='sTooltip' data-jbox-title='Spince Extracted Sentence' data-jbox-content='" + cleanSentenceInsert.trim() + "." + "'><img src='" + imagePath + "' style='height:7px;width:7px' /></span>");							
												
			}
			
		});
	
	// check if really low score - don't show summary, page most likely does not use proper structure
	} else if (linkScoreArray[0] < currentMaxScore * 0.1) {
	
		// find the anchor that matches the href
		$("a[href='" + linkHref + "']").each(function () {

			// check if the link text matches
			if ($(this).text().trim() === linkText.trim()) {

				// clean the text
				cleanLinkTextInsert = unescapeHTML(linkText);
				cleanLinkTextInsert = stripTags(cleanLinkTextInsert);
				cleanSentenceInsert = unescapeHTML(sentences[currentMaxSentence]);
				cleanSentenceInsert = stripTags(cleanSentenceInsert);
				cleanSentenceInsert = stripJunk(cleanSentenceInsert);
				
				// delete the loading				
				$(this).html( cleanLinkTextInsert );
						
				// change to dash
				$(this).append("-");											
			
			}
			
		});			
	
	} else {

		// change link display
		imagePath = chrome.extension.getURL('/img/red.png');		
				
		// find the anchor that matches the href
		$("a[href='" + linkHref + "']").each(function () {

			// check if the link text matches
			if ($(this).text().trim() === linkText.trim()) {

				// clean the text
				cleanLinkTextInsert = unescapeHTML(linkText);
				cleanLinkTextInsert = stripTags(cleanLinkTextInsert);
				cleanSentenceInsert = unescapeHTML(sentences[currentMaxSentence]);
				cleanSentenceInsert = stripTags(cleanSentenceInsert);
				cleanSentenceInsert = stripJunk(cleanSentenceInsert);
				
				// delete the loading				
				$(this).html( cleanLinkTextInsert );
						
				// insert the tooltip and red square - use empty onclick for touch screens											
				$(this).after("&nbsp;<span class='sTooltip' data-jbox-title='Spince Extracted Sentence' data-jbox-content='" + cleanSentenceInsert.trim() + "." + "'><img src='" + imagePath + "' style='height:7px;width:7px'/></span>");							
				
			}
			
		});
		
	}
			
	// move to next link
	linkNo = linkNo + 1;
	
	if (backFlag === "yes") {
	
		sendBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);				
	
	} else {
	
		ajaxProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);
	}
	
}

// create a random identifier to id this page to background process
const randID = Math.floor(Math.random() * 10000000000) + 1; 

function startBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo) {

	// send the first non-protocol link
	if (hrefLaterArrayR.length > 0 ) {

		// add a listener to handle the receipt of background messages
		chrome.runtime.onMessage.addListener(
		  function(request, sender, sendResponse) {
			
			// check that response
			if (request.randNo !== randID ) {
			
				// ignore response
				
			} else if ((request.message === "pTextLinkError") && (request.linkNo >= 0)) {  
			  							
				// find the anchor that matches the href
				$("a[href='" + hrefLaterArrayR[request.linkNo] + "']").each(function () {
							 
					// check if the link text matches
					if ($(this).text() === textLaterArray[request.linkNo]) {
						
						// delete the loading spinner
						$(this).html( textLaterArray[linkNo] );
						
						// change to dash
						$(this).append("-");
					
					}
					
				});
								
				// move to next link
				linkNo = linkNo + 1;
				
				sendBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo);				
							  
			} else if (request.message === "pTextLink") {

				// clean the corpus
				cleanCorpus(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,request.linkNo,request.pText,"yes")							
			
			}
								
		});
		
		// send first non-protocol link to background		
		sendBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,0);				
		
		
	} else {

		// no links with non-protocol, stop
		
	}		
	
}

function sendBackgroundProcess(stopWords,hrefArrayA,hrefArrayR,textArray,hrefLaterArrayA,hrefLaterArrayR,textLaterArray,linkNo) {

	// check that a link exists
	if ((linkNo >= hrefLaterArrayR.length) && (hrefLaterArrayR.length > 0)) {	

		// no more links with non-protocol type, stop		
		
	} else {

		// set the link display to show loading			
		var imagePath = chrome.extension.getURL('/img/blue.gif');
	
		// find the anchor that matches the href
		$("a[href='" + hrefLaterArrayR[linkNo] + "']").each(function () {
					 
			// check if the link text matches
			if ($(this).text() === textLaterArray[linkNo]) {

				// insert the loading spinner
				$(this).append("&nbsp;<img src='" + imagePath + "' style='height:7px;width:7px' />");
			
			}
			
		});		
	
		// send non-protocol link to background		
		chrome.runtime.sendMessage({"message": "ajaxLink", "randNo": randID, "linkNo": linkNo, "hrefLater": hrefLaterArrayA[linkNo]});
		
	}
	
}
