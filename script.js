


const TYPE_SPEED = 85
const TYPE_SPEED_VARIATION = 30
const TYPE_SPEED_OSCILLATION = 100
const TYPE_SPEED_WIDTH = 10
const TYPE_SPEED_UNIT = ( Math.PI * 2 ) / 10


const PRINT_SPEED = 185
const PRINT_SPEED_VARIATION = 30

let username = "main@ubuntu"


let wait = async (ms) => {
    return new Promise((resolve, _) => {
       setTimeout(() => resolve('timeout succeeded'), ms)
    })
}

let inputElement = document.querySelector('#terminal__input')

let terminalOutput = ""

let cursorIndex = 0

let addToInputAndWait = async (content,speed) => {
    return new Promise((resolve, _) => {
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
        resolve()
    }).then(() => {
        return wait(speed)//+TYPE_SPEED_OSCILLATION*Math.sin( inputElement.length * TYPE_SPEED_UNIT ))
    })

}

let deleteAtCursor = async () => {
    return new Promise((resolve, _) => {
        terminalOutput = terminalOutput.slice(0, cursorIndex - 1) + terminalOutput.slice(cursorIndex)
        resolve()
    })
}

let decrementCursor = async () => {
    cursorIndex -= 1
    return Promise.resolve()
}

let processCommand = async (command, index, speedFactor) => {
    let promise = Promise.resolve()
    switch(command){
        case "enter":
            cursorIndex = 0
            promise = addToInputAndWait("\n",TYPE_SPEED * speedFactor)
            break
        case "left":
            promise = [...Array(Math.abs(index)).keys()].reduce((accum, _) => {
                return accum.then(() => {
                    return decrementCursor().then(() => addToInputAndWait("",TYPE_SPEED * speedFactor))
                })
            }, Promise.resolve())
            break
        case "back":
            promise = deleteAtCursor()
    }
    return promise
}

let typeToTerminal = async (content, speedFactor) => {
    // print 1 character at a time with 100ms delay
    let charArray = content.split('')
    return await charArray.reduce((accum, char) => {
        return accum.then(() => addToInputAndWait(char,TYPE_SPEED * speedFactor))
    }, Promise.resolve())//.then(() => addToInputAndWait("\n"))
}

let printToTerminal = async (content, speedFactor) => {
    // print line by line
    let lineArray = content.split("\n")
    for ( let i = 0 ; i < lineArray.length - 1 ; i++ ){
        lineArray[ i ] += "\n"
    }
    return await lineArray.reduce((accum, line) => {
        return accum.then(() => {
            return addToInputAndWait(line,PRINT_SPEED * speedFactor).then(() => {
                terminal__input.scrollTo(0,10000)
                return Promise.resolve()
            })
        })//.then(() => addToInputAndWait("\n"))
    }, Promise.resolve())
}

let animateTerminal = (terminalText) => {
    return terminalText.reduce((accum, element) => {
        let action = element.action
        let value = ''
        let index = 0
        let speedFactor = 1.0 / (element.speed || 1)
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
                return printToTerminal(value, speedFactor)
            } else if (action === 'user') {
                if ( value ) {
                    username = value
                }
                return printToTerminal("<user>" + username + "</user>: <loc>~</loc> $ ", speedFactor)
            } else if (action === 'type') {
                return typeToTerminal(value, speedFactor)
            } else if (action === 'command') {
                return processCommand( value, index, speedFactor )
            } else if (action === 'wait') {
                return wait(parseInt(value))
            } else {
                console.log('invalid')
                return Promise.resolve()
            }
        })
    }, Promise.resolve())
}

let startAnimateTerminal = () => {
    fetch('terminal_output.json')
        .then(resp => resp.json())
        .then(jsonData => animateTerminal(jsonData))
}