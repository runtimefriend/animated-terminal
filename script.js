


const TYPE_SPEED = 85
const TYPE_SPEED_VARIATION = 30
const TYPE_SPEED_OSCILLATION = 100
const TYPE_SPEED_WIDTH = 10
const TYPE_SPEED_UNIT = ( Math.PI * 2 ) / 10


const PRINT_SPEED = 385
const PRINT_SPEED_VARIATION = 30

let username = "main@ubuntu"


let wait = async (ms) => {
    return new Promise((resolve, _) => {
       setTimeout(() => resolve('timeout succeeded'), ms);
    });
}

let inputElement = document.querySelector('#terminal__input')

let terminalOutput = ""

let cursorIndex = 0

let addToInputAndWait = async (content) => {
    //if (content) {
        return new Promise((resolve, _) => {
            /*if( content == ' '){
                content = "&nbsp;"
            }*/
            //inputElement.innerHTML = (inputElement.innerHTML + content).replace("<cursor></cursor>", "") + "<cursor></cursor>"
            if(cursorIndex==0){
                terminalOutput = terminalOutput + content
                inputElement.innerHTML = terminalOutput + "<cursor></cursor>"
            }else{
                let cursorPosition = terminalOutput.length + cursorIndex

                terminalOutput =
                    terminalOutput.substring(0,cursorPosition)
                    + content
                    + terminalOutput.substring(cursorPosition)
                inputElement.innerHTML =
                    terminalOutput.substring(0,cursorPosition)
                    + content
                    + "<cursor>"
                    + terminalOutput.charAt(cursorPosition)
                    + "</cursor>"
                    + terminalOutput.substring(cursorPosition+1)
            }
            //inputElement.innerHTML = inputElement.innerHTML.substring( 0 , inputElement.innerHTML.length - 17 ) + content + "<cursor></cursor>"
            resolve()
        }).then(() => {
            return wait(TYPE_SPEED)//+TYPE_SPEED_OSCILLATION*Math.sin( inputElement.length * TYPE_SPEED_UNIT ))
        })
    //} else {
    //    return Promise.resolve()
    //}
}

let deleteAtCursor = async () => {
    return new Promise((resolve, _) => {
        terminalOutput = terminalOutput.slice(0, cursorIndex - 1) + terminalOutput.slice(cursorIndex)
        resolve()
    })
}

/*let processCommand = (charArray,i) => {
    if(charArray[i] == '<'){
        let commandStart = i+1
        while(true){
            i++
            if (i > charArray.length){
                break
            }
            if (charArray[i] == '>' || charArray[i] == '-') {
                let command = charArray.slice(start,i).toString()
                if (charArray[i] == '-'){
                    let timeStart = i
                    while(true){
                        i++
                        if (i > charArray.length){
                            break
                        }
                        if(charArray[i] == '>'){
                            //let time = charArray.slice()
                        }
                    }
                }
            }
        }
    }
    return i
}*/
let decrementCursor = async () => {
    cursorIndex -= 1
    return Promise.resolve()
}

let processCommand = async (command, index) => {
    let promise = Promise.resolve()
    switch(command){
        case "enter":
            cursorIndex = 0
            promise = addToInputAndWait("\n")
            break
        case "left":
            promise = [...Array(Math.abs(index)).keys()].reduce((accum, _) => {
                return accum.then(() => {
                    return decrementCursor().then(() => addToInputAndWait(""))
                })
            }, Promise.resolve())
            break
        case "back":
            promise = deleteAtCursor()
    }
    return promise
}

let typeToTerminal = async (content) => {
    // print 1 character at a time with 100ms delay
    let charArray = content.split('')
    return await charArray.reduce((accum, char) => {
        return accum.then(() => addToInputAndWait(char))
    }, Promise.resolve())//.then(() => addToInputAndWait("\n"))
}

let printToTerminal = async (content) => {
    // print line by line
    let lineArray = content.split("\n")
    for ( let i = 0 ; i < lineArray.length - 1 ; i++ ){
        lineArray[ i ] += "\n"
    }
    return await lineArray.reduce((accum, line) => {
        return accum.then(() => {addToInputAndWait(line);terminal__input.scrollTo(0,10000)})//.then(() => addToInputAndWait("\n"))
    }, Promise.resolve())
}

let animateTerminal = (terminalText) => {
    return terminalText.reduce((accum, element) => {
        let action = element.action
        let value = ''
        let index = 0
        if (typeof(element.value) == 'string') {
            value = element.value
        } else if (element.value) {
            value = element.value.join("\n")
        }
        if (element.index) {
            index = element.index
        }
        return accum.then(() => {
            if (action === 'print') {
                return printToTerminal(value)
            } else if (action === 'user') {
                if ( value ) {
                    username = value
                }
                return printToTerminal("<user>" + username + "</user>: <loc>~</loc> $ ")
            }else if (action === 'type') {
                return typeToTerminal(value)
            } else if (action === 'command') {
                return processCommand( value, index )
            } else if (action === 'wait') {
                return wait(parseInt(value))
            } else {
                console.log('invalid')
                return Promise.resolve()
            }
        })
    }, Promise.resolve())
}

fetch('intro.json')
    .then(resp => resp.json())
    .then(jsonData => animateTerminal(jsonData))