import * as PIXI from 'pixi.js';
import { shuffleArray } from './utils';

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
            mask.tint = "0x000000";
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
    scoreHTML: HTMLElement;
    scoreValueHTML: HTMLElement;
    questionHTML: HTMLElement;
    feedbackHTML: HTMLElement;
    newGameButtonHTML: HTMLElement;
    copyWriteHTML: HTMLElement;

    constructor(app: PIXI.Application, anatomyData: any) {
        this.app = app;
        this.beeAnatomy = new BeeAnatomy(anatomyData.name, anatomyData.image)
        //Link action
        this.beeAnatomy.sprite.on('pointertap', () => {
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
                hitArea.on('pointertap', () => {
                    this.showFeedback(true);
                });
            }
            
            this.beeParts.push(beePart)
        };
        this.numQuestions = this.beeParts.length;

        //Build HTML elements
        //<div id="score">Score: <span id="score-value">0/27</span></div>
        this.scoreHTML = document.createElement('div');
        this.scoreHTML.id = "score";
        this.scoreHTML.innerHTML = "Score: ";
        this.scoreValueHTML = document.createElement('span');
        this.scoreValueHTML.id = "score-value";
        this.scoreHTML.append(this.scoreValueHTML);
        this.setScore();

        //<div id="question"></div>
        this.questionHTML = document.createElement('div');
        this.questionHTML.id = "question";
        
        //<div id="feedback"></div>
        this.feedbackHTML = document.createElement('div');
        this.feedbackHTML.id = "feedback";

        this.newGameButtonHTML = document.createElement('div');
        this.newGameButtonHTML.id = "new-game";
        this.newGameButtonHTML.innerHTML = "New Game";
        this.newGameButtonHTML.addEventListener('click', () => {
            this.start();
        });

        this.copyWriteHTML = document.createElement('div');
        this.copyWriteHTML.id = "image-copywrite";
        this.copyWriteHTML.innerHTML = anatomyData.copywriteLink;
    }

    start() {
        // Remove new game if it exists
        this.removeNewGameButton();

        // Set up the quiz
        this.questionIndex = 0;
        this.score = 0;
        this.setScore();

        // Add HTML elements if needed
        if (!(this.scoreHTML.parentElement === document.body)) document.body.append(this.scoreHTML);
        if (!(this.questionHTML.parentElement === document.body)) document.body.append(this.questionHTML);
        if (!(this.feedbackHTML.parentElement === document.body)) document.body.append(this.feedbackHTML);
        if (!(this.copyWriteHTML.parentElement === document.body)) document.body.append(this.copyWriteHTML);
    
        // Randomize question order
        shuffleArray(this.beeParts);
        
        // Move the sprite to the center of the screen
        this.beeAnatomy.sprite.x = this.app.screen.width / 2;
        this.beeAnatomy.sprite.y = this.app.screen.height / 2;
    
        for (const beePart of this.beeParts) {
            // Reset questions
            beePart.asked = false;
            // Mask all the labels
            for (const labelMask of beePart.labelMasks) {
                labelMask.alpha = 1;
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

    cleanUp() {
        // Remove HTML
        document.body.removeChild(this.feedbackHTML);
        document.body.removeChild(this.questionHTML);
        document.body.removeChild(this.scoreHTML);
        this.removeNewGameButton();
        document.body.removeChild(this.copyWriteHTML);

        // Remove sprite
        this.app.stage.removeChild(this.beeAnatomy.sprite);
        this.app.renderer.reset();
    }

    // Ask a question
    askQuestion() {
        let beePart = this.beeParts[this.questionIndex];
        for (const hitArea of beePart.hitAreas) {
            this.beeAnatomy.sprite.addChild(hitArea);
        }
        this.setQuestion(`Select the ${beePart.name}`);
    }



    // Show the feedback
    showFeedback(correct : boolean) {
        const feedbackDiv = document.getElementById('feedback');
        if (!this.beeParts[this.questionIndex].asked) {
            this.beeParts[this.questionIndex].asked = true;

            // Remove in previous bee part hit area
            for (const hitArea of this.beeParts[this.questionIndex].hitAreas) {
                this.beeAnatomy.sprite.removeChild(hitArea);
            }
            // Show the feedback and update score
            if (correct) {
                // Show labels after question is answered
                for (const labelMask of this.beeParts[this.questionIndex].labelMasks) {
                    this.beeAnatomy.sprite.removeChild(labelMask);
                }
                this.score++;
                this.setScore();
            } else  {
                // Show red tinted label for incorrect answer
                for (const labelMask of this.beeParts[this.questionIndex].labelMasks) {
                    labelMask.alpha = .3;
                    labelMask.tint = "0xff0000";
                }
            }
            this.setFeedback(correct);

            // Fade feedback and then show next question
            setTimeout(() => {
                this.fadeFeedback()
                // Ask the next question when the feedback is done
                this.questionIndex++;
                if (this.questionIndex < this.numQuestions) {
                    this.askQuestion();
                } else {
                    this.showScore();
                    this.beeAnatomy.sprite.interactive = false;
                }
            }, 1100);
        }
    }

    setScore() {
        this.scoreValueHTML.innerHTML = `${this.score}/${this.numQuestions}`;
    }

    setQuestion(prompt: string) {
        this.questionHTML.innerHTML = prompt;
    }

    setFeedback(correct: boolean) {
        if (correct) {
            this.feedbackHTML.innerHTML = 'Correct!';
            this.feedbackHTML.classList.add('correct');
        } else {
            this.feedbackHTML.innerHTML = 'Incorrect!';
            this.feedbackHTML.classList.add('incorrect');
        }
        this.feedbackHTML.style.opacity = "1";
    }

    fadeFeedback(){
        this.feedbackHTML.style.opacity = "0";
        this.feedbackHTML.classList.remove('correct', 'incorrect');
    }

    // Show the score
    showScore() {
        if (this.score == this.numQuestions) {
            this.setQuestion('Congratulations! You got a perfect score!!!');
        } else {
            this.setQuestion(`Game over. Your score is ${this.score} out of ${this.numQuestions}.`);
        }
        this.addNewGameButton();
    }

    // Show the "New Game" button
    addNewGameButton() {
        if (!(this.newGameButtonHTML.parentElement === document.body)) {
            document.body.prepend(this.newGameButtonHTML)
        }
    }
    removeNewGameButton() {
        if (this.newGameButtonHTML.parentElement === document.body) {
            document.body.removeChild(this.newGameButtonHTML);
        }
    }
}