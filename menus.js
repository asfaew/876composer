import "./scripts/jquery.js" // animator

globalThis.baker = new class { //Chasyxx's bakers chasyxx.github.io/minibaker
	constructor() {
		this.in = null
		this.temp = null
		this.c1 = null
		this.c2 = null
		this.cc1 = null
		this.cc2 = null
		this.cmb = null
		this.sts = null
	}
	minibake(str) {
		if (str.length & 1) {
			str += " "
		}
		str = str.replace(/, /g, ",")
		let len = Math.floor(str.length / 2)
		let output = ""
		for (let i = 0; i < len; i++) {
			this.c1 = str.substring(i * 2, i * 2 + 1)
			this.c2 = str.substring(i * 2 + 1, i * 2 + 2)
			this.cc1 = this.c1.charCodeAt(0)
			this.cc2 = this.c2.charCodeAt(0)
			this.cmb = (this.cc1 << 8) | this.cc2
			output += String.fromCharCode(this.cmb)
			//output += String.fromCodePoint(cmb)
		}
		return "eval(unescape(escape`" + output + "`.replace(/u(..)/g,\"$1%\")))"
	}
	debake(str) {
		str = str.trim().replace(
			/^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/,
			(match, p1) => (unescape(escape(p1).replace(/u(..)/g, '$1%'))));

		return str
	}
}

/*===========================  ==     ==  ==  === =   =  ===========================*/
/*===========================  = =   = = =  =  =  ==  =  ===========================*/
/*===========================  =  = =  = ====  =  = = =  ===========================*/
/*===========================  =   =   = =  = === =  ==  ===========================*/

globalThis.MAT = new class { //Menus and transformations
	constructor() {
		this.currentMenu = 1
		this.errorReason = null
		this.errorChar = null
		this.isErrored = false
		this.considerParens = true //Console should be able to change this
		this.formatted = null
		this.code = document.getElementById('editor-default')
		this.forceElem = document.getElementById('control-force-output')
		this.clearElem = document.getElementById('control-clear-output')
		this.startElem = document.getElementById('control-format')
		this.bakeElem = document.getElementById('control-minibake')
		this.debakeElem = document.getElementById('control-deminibake')
		this.tabName = document.getElementById('TAB-NAME')
		this.disappear = [document.getElementById(`control-sum`)]
		this.AprilFoolsElements = [this.bakeElem, this.debakeElem]
		this.errorText = null
		this.oldCode = null
		this.MaxParenLayersAllowed = 0
		this.localTest = null

		this.init()
	}

	get codeText() {
		return this.localTest ? this.code.value : bytebeat.editorValue
	}

	changeMenu(x) {
		let oldMenu = document.getElementById(`controls${this.currentMenu}`)
		let newMenu = document.getElementById(`controls${x}`)
		$(oldMenu).animate({ opacity: 0 }, 250, 'swing', function () {
			$(oldMenu).addClass('hidden')
			newMenu.style = "opacity: 0"
			$(newMenu).removeClass('hidden')
			$(newMenu).animate({ opacity: 1 }, 250, 'swing')
		})
		this.currentMenu = x
	}
	startError(reason, char = -1) {
		this.errorReason = reason
		this.errorChar = char
		this.isErrored = true
	}
	setCodeMirrorEditor(string) {
		bytebeat.editorView.dispatch({
			changes: {
				from: 0,
				to: bytebeat.editorView.state.doc.toString().length,
				insert: string
			}
		})
	}
	async output(text = this.formatted, update = false) {

		await this.bytebeatReady;

		if (this.localTest) {
			this.code.value = text
		} else {
			this.setCodeMirrorEditor(text)
		}
		try {
			if (update && !this.localTest) {
				bytebeat.updateUrl() //Commit changes to the saved URL
			}
		} catch (err) { console.error(`URL not saved (${err.message})`) }
	}
	async commaFormat() {

		await this.bytebeatReady;

		let initialCode
		let toEncode;
		let parenLayerCount = 0
		if (this.localTest) {
			toEncode = initialCode = this.code.value
		} else {
			toEncode = initialCode = bytebeat.editorValue
		}
		let inString = false
		let arrayLayerCount = false
		for (let i = 0; i < toEncode.length; i++) {
			if (this.isErrored) { break } // error handling
			switch (toEncode[i]) {
				case `,`: case ``:
					console.log(this.MaxParenLayersAllowed + " , " + parenLayerCount + ": " + (parenLayerCount < (this.MaxParenLayersAllowed + 1)))
					if ((parenLayerCount < (this.MaxParenLayersAllowed + 1) || !this.considerParens) && (arrayLayerCount == 0) && !inString && toEncode[i + 1] != `\n`) {
						toEncode = toEncode.slice(0, i) + `${toEncode[i]}\n` + toEncode.slice(i + 1, toEncode.length)
					}
					break

				case `\``: case `'`: case `"`:
					if (inString && toEncode[i - 1] != '\\') {
						if (inString == toEncode[i]) {
							inString = false
						}
					} else (
						inString = toEncode[i]
					)
					break

				case `[`:
					if (!inString) {
						arrayLayerCount++
					}
					break

				case `]`:
					if (!inString) {
						arrayLayerCount--
						if (arrayLayerCount < 0) {
							this.startError("Unbalanced array", i)
						}
					}
					break

				case `(`:
					if (!inString) {
						parenLayerCount++
					}
					break

				case `)`:
					if (!inString) {
						parenLayerCount--
						if (parenLayerCount < 0) {
							this.startError("Unbalanced parenthesies", i)
						}
					}
					break
			}
		}
		this.formatted = toEncode
		this.errorText = null
		if (arrayLayerCount > 0) {
			console.error(this.errorText = "Error in comma-formatting: Unbalanced array!")
			this.isErrored = true
		} else if (parenLayerCount > 0) {
			console.error(this.errorText = "Error in comma-formatting: Unbalanced parenthesies!")
			this.isErrored = true
		} else if (this.isErrored) {
			console.error(this.errorText = `Error in comma-formatting at char ${this.errorChar}: ${this.errorReason}!`)
		} else { this.output(this.formatted, true) }
		if (!this.isErrored) {
			console.log("Sucessfully formatted!")
		}
		if (this.isErrored) {
			this.output(`${initialCode} \n\n// ${this.errorText}`, false)
			this.oldCode = initialCode
		}
		this.isErrored = false
	}
	async bake() {
		let wasPlaying = false;

		await this.bytebeatReady;

		let toEncode

		if (this.localTest) {
			toEncode = this.code.value
		} else {
			toEncode = bytebeat.editorValue
			wasPlaying = bytebeat.isPlaying
		}

		if (/^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/.test(toEncode)) {
			document.getElementById("code-is-already-minibaked").showModal()
			document.getElementById("dialog-close").onclick=()=>{document.getElementById("code-is-already-minibaked").close()}
			return
		} else {
			bytebeat.playbackToggle(false)
		}

		const l = baker.minibake(toEncode)
		if (baker.debake(l) !== l) {
			this.output(l, true)
		} else {
			const warn = "// Minibaking failed: An illegal character would cause the player to lag."
			this.output(`${warn}\n\n${toEncode}\n\n${warn}`)
		}
		if (wasPlaying) {
			bytebeat.playbackToggle(true)
		}
		return
	}
	async debake() {
		let wasPlaying = false;

		await this.bytebeatReady;
		let toEncode

		if (this.localTest) {
			toEncode = this.code.value
		} else {
			toEncode = bytebeat.editorValue
			wasPlaying = bytebeat.isPlaying
			bytebeat.playbackToggle(false)
		}
		this.output(baker.debake(toEncode), true)
		if (wasPlaying) {
			bytebeat.playbackToggle(true)
		}
	}
	init() {
		this.bytebeatReady = new Promise(resolve => {
			const checkLoaded = () => {
				if (typeof bytebeat !== 'undefined') {
					resolve();
				} else {
					setTimeout(checkLoaded, 50);
				}
			};
			checkLoaded();
		});

		this.bytebeatReady.then(() => {
			const lookforeditor = () => {
				try {
					if (bytebeat?.editorValue === undefined) {
						this.localTest = true;
					}
				} catch {
					setTimeout(lookforeditor, 100)
				}
			}
			// The bytebeat class has fully loaded, so we can safely access its properties and methods. 
			// Check to make sure the editor value is registered after 50ms
			lookforeditor()
		});
	}
	setParens(x) {
		x -= 0
		this.MaxParenLayersAllowed = x
		console.log(x + ": " + typeof x)
	}
	async seed(forTitle = false, toEncode) {

		await this.bytebeatReady;

		if (this.localTest && !toEncode) {
			toEncode = this.code.value
		} else if (!toEncode) {
			toEncode = bytebeat.editorValue
		}
		let inputLength = toEncode.length
		let temp = 0
		let temp3 = 0
		for (let i = 0; i < inputLength; i++) {
			temp += toEncode.charCodeAt(Math.ceil(i * 1.5) % inputLength)
			temp3 += toEncode.charCodeAt(i) * (i & 1 ? i : -i)
		}
		let temp2 = btoa(temp.toString(36)).replaceAll('=', '');
		let temp4 = btoa(temp3.toString(36)).replaceAll('=', '');
		let finalSeed = (temp2 + "-" + temp4)
		if (forTitle) {
			this.tabName.innerText = "87634218675342698753-" + finalSeed
		}
		return finalSeed
	}

	switch(X) {
		let collection = document.getElementsByClassName('optionalEntry')
		for (let i = 0; i < collection.length; i++) {
			let x = collection.item(i)
			if (X == 1) { x.style = "opacity: 0 "; $(x).removeClass('hidden') }
			$(x).animate({ opacity: X ? 1 : 0 }, 250, () => {
				if (X == 0) { $(x).addClass('hidden') }
			})
		}
	}
}

await new Promise(resolve => {
	const checkLoaded = () => {
		if (typeof bytebeat !== 'undefined') {
			resolve();
		}
	};
});

// \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/Favorites system\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

globalThis.favorites = new class {
	constructor() {
		this.save = document.getElementById('favorite-save');
		this.name = document.getElementById('favorite-name');
		this.opener = document.getElementById('favorites-button');
		this.status = document.getElementById('favorites-status');
		this.contents = document.getElementById('favorites-contents');

		this.first = [";", "\n", "=", " ", "\t"];
		this.second = ["&SEMI", "&BREAK", "&EQUAL", "&SPACE", "&TAB"];

		console.log("started!", this);
		this.init();
	}

	cook(str) {
		let temp = str.replace(/&/g, "&AND");
		for (let i in this.first) {
			let detector = new RegExp((this.first)[i], 'g')
			let replacor = (this.second)[i]
			temp = temp.replace(detector, replacor)
		}
		return temp
	}

	uncook(str) {
		let temp = str;
		for (let i in this.first) {
			let detector = new RegExp(this.second[i], 'g')
			let replacor = this.first[i]
			temp = temp.replace(detector, replacor)
		}
		return temp.replace(/&AND/g, "&")
	}

	escapeHTML(text) {
		bytebeat.cacheTextElem.nodeValue = text;
		return bytebeat.cacheParentElem.innerHTML;
	}

	async init() {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', this.ready);
			return;
		}
		this.ready();
	}

	ready() {
		console.log("setup!");
		this.opener.onclick = () => {
			this.generate(); this.opener.onclick = null;
		}
		this.save.onclick = () => {
			this.make(this.name.value, bytebeat.editorValue);
		}
	}

	make(name, code) {
		const finalName = this.cook(name);
		const finalCode = this.cook(code);
		document.cookie = `${finalName}=${finalCode}; expires=Fri, 01 Jan 2038 06:00:00 GMT` // change this in 2037

		this.generate();
		this.name.value = "Name";
	}

	generate() {
		this.contents.innerHTML = '';
		const cookies = document.cookie;
		const cookieRegex = /([^=;\s]+)=([^;]+)/g;
		let match;
		while ((match = cookieRegex.exec(cookies)) !== null) {
			const songName = match[1];
			const code = match[2];
			if (songName == "_ga" || code == "deleted-favorite") { continue };
			console.log(`Cookie: ${songName} = ${code}`);
			this.contents.innerHTML += this.generateEntry(songName, code);
		}
	}

	generateEntry(name, code) {
		const header = this.escapeHTML(this.uncook(name));
		const contents = this.uncook(code)

		return `<li><button id="favorite-name" onclick="favorites.remove(this)">${header}</button><br /><button class="code-text code-text-original" data-songdata='{}' code-length="${contents.length}">${this.escapeHTML(contents)}</button></li>`
	}

	async remove(Elem) {
		const section = Elem.parentNode; // get the li sourrounding each entry
		const name = this.cook(Elem.innerText)

		console.log(name)

		let waiter = new Promise((resolve, reject) => {
			document.getElementById("are-you-sure").showModal()
			document.getElementById("dialog-yes").onclick = () => resolve()
			document.getElementById("dialog-no").onclick = () => reject()
		})

		waiter.then(() => {
			document.cookie = `${name}=deleted-favorite; expires=Thu, 01 Jan 1970 00:00:00 UTC`
			section.remove()
			document.getElementById("are-you-sure").close()
		}).catch(()=>{
			document.getElementById("are-you-sure").close()			
		})

		try{await waiter}catch{}
	}

}();


// \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\April fools handler\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/

let logdiv = document.getElementById('log')
let headers = document.getElementsByClassName('library-header')
let modes = document.getElementsByClassName('song-options')
let currentDate = new Date()
let day = currentDate.getDate()
let month = currentDate.getMonth() + 1

let apfo = async () => {
	try {

		if (month == 4 && day == 1) {
			let r = "The FitnessGram™ Pacer Test is a multistage aerobic capacity test that progressively gets more difficult as it continues. The 20 meter pacer test will begin in 30 seconds. Line up at the start. The running speed starts slowly, but gets faster each minute after you hear this signal. [beep] A single lap should be completed each time you hear this sound. [ding] Remember to run in a straight line, and run as long as possible. The second time you fail to complete a lap before the sound, your test is over. The test will begin on the word start. On your mark, get ready, start."
			const trigger = bytebeat.editorValue == "a=\"CHASYXX Bytebeat composer\",aa=a.charCodeAt((((t&t>>14)&7)+t*(t>>11&7^t>>10&3))%(a.length)),\nb=\"by Chase T\",bb=b.charCodeAt((((t&t>>17)&7)+t*(t>>12&7^t>>10&7))%(b.length)),\nc=\"Fork of StephanShi's player\"	,cc=c.charCodeAt(((t&t>>20)+((t*1.07)>>2)*(t>>13&7^t>>10&15))%(c.length)),\n((aa+bb+cc)/2)|t>>4"

			if (trigger) {
				MAT.setCodeMirrorEditor(r)
				MAT.AprilFoolsElements.forEach(X => {
					X.innerText = r
				});
				for (let i = 0; i < headers.length; i++) {
					headers.item(i).innerText = "beep"
				}
				for (let i = 0; i < modes.length; i++) {
					modes.item(i).inneHTML = "pacing"
				}
			}
			let s = Math.floor(Math.random() * (r.length) * 2) + (r.length * 1)
			for (let i = 0; i < s; i++) {
				const IIOR = Math.random() > 0.5
				logdiv.innerHTML += r[i % r.length] + (IIOR ? "<br>" : "")
				if (IIOR) {
					await new Promise(resolve => setTimeout(resolve, 25));
				}
			}
		}

	} catch (ERR) {
		logdiv.innerText = ERR.stack
	}
}
setTimeout(apfo, 1000)

