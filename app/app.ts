import { Quiz } from "./quiz"
import * as PIXI from 'pixi.js';

// Create a PixiJS application
const app = new PIXI.Application<HTMLCanvasElement>({
	width: 1000,
	height: 1000,
	backgroundColor: 0xffffff
});
document.body.appendChild(app.view);

const fullAnatomyData = await loadAnatomyData()
fullAnatomyData.anatomyDiagrams[0].image = await PIXI.Assets.load(fullAnatomyData.anatomyDiagrams[0].image)
const quiz = new Quiz(app, fullAnatomyData.anatomyDiagrams[0])
quiz.start()

async function loadAnatomyData() {
	try {
		const response = await fetch('assets/data/anatomy_data.json');
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(error);
	}
}