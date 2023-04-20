import * as PIXI from 'pixi.js';

class BeeAnatomy {
    name: string;
    image: PIXI.Texture;
    sprite: PIXI.Sprite;

    constructor(name: string, image: PIXI.Texture) {
        this.name = name;
        this.image = image;
        this.sprite = new PIXI.Sprite(this.image);
        this.sprite.anchor.set(0.5);
    }
}

class BeePart {
    name: string;
    labelMasks: PIXI.Graphics[];
    hitAreas: PIXI.Sprite[];
    asked: boolean;

    constructor (name:string, labelMasks: number[][], hitAreas: number[][]) {
        this.name = name;
        this.asked = false;
        // Masks for the label of the bee part
        this.labelMasks = [];
        for (const labelMask of labelMasks){
            let mask = new PIXI.Graphics();
            mask.beginFill(0xffffff);
            mask.drawPolygon(labelMask);
            this.labelMasks.push(mask)
        } 

        // clickable areas of the bee part
        this.hitAreas = [];
        for (const hitArea of hitAreas){
            let area = new PIXI.Sprite();
            area.hitArea = new PIXI.Polygon(hitArea);
            area.interactive = true;
            this.hitAreas.push(area)
        } 

    }
}

export class Quiz {
    app: PIXI.Application;
    beeAnatomy: BeeAnatomy;
    beeParts: BeePart[];
    score: number;
    numQuestions: number;
    questionIndex: number;
    numQuestionsHTML: HTMLElement | string;
    scoreHTML: HTMLElement | string;
    questionHTML: HTMLElement | string;
    feedbackHTML: HTMLElement | string;

    constructor(app: PIXI.Application, anatomyData: any) {
        this.app = app;
        this.beeAnatomy = new BeeAnatomy(anatomyData.name, anatomyData.image)
        //Link action
        this.beeAnatomy.sprite.on('pointerdown', () => {
            this.showFeedback(false);
        });
        this.beeParts = [];
        for (const beePartData of anatomyData.parts) {
            let beePart = new BeePart(
                beePartData.name,
                beePartData.nameMasks,
                beePartData.selectPolygons
            )

            //Link action to hitAreas
            for (const hitArea of beePart.hitAreas) {
                hitArea.on('pointerdown', () => {
                    this.showFeedback(true);
                });
            }
            
            this.beeParts.push(beePart)
        };
        this.numQuestions = this.beeParts.length;
    }

    async start() {
        // Randomize question order
        shuffleArray(this.beeParts);
    
        // Set up the quiz
        this.questionIndex = 0;
        this.score = 0;
        
        this.numQuestionsHTML = document.getElementById('num-questions') || "";
        this.scoreHTML = document.getElementById('score-value') || "";
        this.questionHTML = document.getElementById('question') || "";
        this.feedbackHTML = document.getElementById('feedback') || "";

        this.setHTML(this.numQuestionsHTML, String(this.numQuestions));
        
        // Move the sprite to the center of the screen
        this.beeAnatomy.sprite.x = this.app.screen.width / 2;
        this.beeAnatomy.sprite.y = this.app.screen.height / 2;
    
        for (const beePart of this.beeParts) {
            // Reset questions
            beePart.asked = false;
            // Mask all the labels
            for (const labelMask of beePart.labelMasks) {
                this.beeAnatomy.sprite.addChild(labelMask);
            }
        }
        
        // Activate sprite
        this.app.stage.addChild(this.beeAnatomy.sprite);
        
        // Ask the first question
        this.askQuestion();
        // Register invalid clicks
        this.beeAnatomy.sprite.interactive = true;
    }

    // Ask a question
    askQuestion() {
        let beePart = this.beeParts[this.questionIndex];
        for (const hitArea of beePart.hitAreas) {
            this.beeAnatomy.sprite.addChild(hitArea);
        }
        const prompt = `Select the ${beePart.name}`;
        this.setHTML(this.questionHTML, prompt);
    }

    // Show the feedback
    showFeedback(correct : boolean) {
        const feedbackDiv = document.getElementById('feedback');
        if (!this.beeParts[this.questionIndex].asked) {
            this.beeParts[this.questionIndex].asked = true;
            // Show labels after question is answered
            for (const labelMask of this.beeParts[this.questionIndex].labelMasks) {
                this.beeAnatomy.sprite.removeChild(labelMask)
            }
            // Remove in previous bee part hit area
            for (const hitArea of this.beeParts[this.questionIndex].hitAreas) {
                this.beeAnatomy.sprite.removeChild(hitArea)
            }
            // Show the feedback and update score
            if (correct) {
                this.score++;
                this.setHTML(this.feedbackHTML, 'Correct!');
                if(this.feedbackHTML instanceof HTMLElement) this.feedbackHTML.classList.add('correct');
                this.setHTML(this.scoreHTML, String(this.score));
            } else  {
                this.setHTML(this.feedbackHTML, 'Incorrect!');
                if(this.feedbackHTML instanceof HTMLElement) this.feedbackHTML.classList.add('incorrect');
            }
            if(this.feedbackHTML instanceof HTMLElement) this.feedbackHTML.style.opacity = "1";
            // Fade feedback and then show next question
            setTimeout(() => {
                if(this.feedbackHTML instanceof HTMLElement) this.feedbackHTML.style.opacity = "0";
                if(this.feedbackHTML instanceof HTMLElement) this.feedbackHTML.classList.remove('correct', 'incorrect');
                // Ask the next question when the feedback is done
                this.questionIndex++;
                if (this.questionIndex < this.numQuestions) {
                    this.askQuestion();
                } else {
                    this.showScore();
                    this.beeAnatomy.sprite.interactive = false;
                }
            }, 1500);
        }
    }

    setHTML(element: string | HTMLElement, value: string) {
        if(element instanceof String) element = value
        if(element instanceof HTMLElement) element.innerHTML = value;
    }

    // Show the score
    showScore() {
        this.setHTML(this.questionHTML, `Game over. Your score is ${this.score} out of ${this.numQuestions}.`);
        if(this.questionHTML instanceof HTMLElement) this.questionHTML.style.opacity = "1";
    }
}


/* Randomize array in-place using Durstenfeld shuffle algorithm */
//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array: any[]) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}