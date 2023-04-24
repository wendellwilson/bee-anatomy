import { Quiz } from "./quiz"
import { toggleBodyElement } from "./utils"

import * as PIXI from 'pixi.js';

// Create a PixiJS application
const app = new PIXI.Application<HTMLCanvasElement>({
	width: 1000,
	height: 1000,
	backgroundColor: 0xffffff
});
// Should allow for zoom and pan
app.renderer.events.autoPreventDefault=false

document.body.append(app.view);

const fullAnatomyData : any = await loadAnatomyData()
const anatomyChoices : any[] = fullAnatomyData.anatomyDiagrams;

// Return to menu button
const returnButtonHTML : HTMLElement = document.createElement('div');
returnButtonHTML.id = "return";
returnButtonHTML.innerHTML = "Return to Menu";

// Build gameMenu html
const menuHTML : HTMLElement = document.createElement('div');
menuHTML.id = "menu";
const menuTitleHTML : HTMLElement = document.createElement('div');
menuTitleHTML.id = "menu-title";
menuTitleHTML.innerHTML = "Select a Bee Anatomy Quiz";
menuHTML.append(menuTitleHTML);
for (const anatomyDiagram of anatomyChoices) {
	const button : HTMLElement = document.createElement('button');
	button.innerHTML = anatomyDiagram.name;
	button.addEventListener('click', () => {
		toggleBodyElement(menuHTML);
		startQuiz(anatomyDiagram, returnButtonHTML);
	});
	menuHTML.append(button);
}

returnButtonHTML.addEventListener('click', () => {
	toggleBodyElement(menuHTML);
	toggleBodyElement(returnButtonHTML);
});

toggleBodyElement(menuHTML);

async function loadAnatomyData() {
	try {
		const response = await fetch('assets/data/anatomy_data.json');
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(error);
	}
}

// Load image and start quiz
async function startQuiz(anatomyDiagram : any, returnButtonHTML : HTMLElement) {
	if(!(anatomyDiagram.image instanceof PIXI.Texture)) anatomyDiagram.image = await PIXI.Assets.load(anatomyDiagram.image);
	const quiz = new Quiz(app, anatomyDiagram);
	returnButtonHTML.addEventListener('click', () => {
		quiz.cleanUp();
	});
	toggleBodyElement(returnButtonHTML);
	quiz.start();
}