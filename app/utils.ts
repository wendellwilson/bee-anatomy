
/* Randomize array in-place using Durstenfeld shuffle algorithm */
//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffleArray(array: any[]) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

// Toggle existance of HTML element
export function toggleBodyElement(element: HTMLElement) {
    if (element.parentElement === document.body) {
        document.body.removeChild(element);
    } else {
        document.body.prepend(element)
    }
}