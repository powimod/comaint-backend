/* Comaint API backend (API server of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * selector-model.js
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied 
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'
const assert = require('assert');


class SelectorModel {
	static #model = null;

	static #elementList = {
		'equipment-family' :  {},
		'equipment-type' :  {},
		'equipment' :  {},
		'equipment-unit' :  {},
		'equipment-section' :  {},
		'workorder': {},
		'intervention': {},
		'article-category' :  {},
		'article-subcategory' :  {},
		'article' :  {},
		'article-unit' :  {},
		'article-section' :  {},
		'nomenclature' :  {},
	}

	static #linkArray = [
		{ source: 'equipment-type',    target: 'equipment-family' },
		{ source: 'equipment',         target: 'equipment-type' },
		{ source: 'equipment-section', target: 'equipment-unit' },
		{ source: 'equipment',         target: 'equipment-section' },

		{ source: 'workorder',         target: 'equipment' },
		{ source: 'intervention',      target: 'equipment' },

		{ source: 'article-subcategory', target: 'article-category' },
		{ source: 'article',             target: 'article-subcategory' },
		{ source: 'article-section',     target: 'article-unit' },
		{ source: 'article',             target: 'article-section' },

		{ source: 'nomenclature',     target: 'article' },
		{ source: 'nomenclature',     target: 'equipment' },
	]
	static #elementArray = []
	static #floorArray = []


	static initialize = () => {
		assert(this.#model === null);
		const ModelSingleton = require('./model.js');
		this.#model = ModelSingleton.getInstance();
		assert(this.#model !== null)

		// initialize properties of each element
		for (const [elementName, element] of Object.entries(this.#elementList)) {
			element.name = elementName
			element.children = []
			element.parents = []
			element.floor = -1  // unknown
			this.#elementArray.push(element)
		}

		// initialize children and parents with links
		for (const link of this.#linkArray) {
			const sourceElement = this.#elementList[link.source]
			assert(sourceElement !== undefined)
			const targetElement = this.#elementList[link.target]
			assert(targetElement !== undefined)
			targetElement.children.push(sourceElement)
			sourceElement.parents.push(targetElement)
		}

		// determine floor number of each element
		const maxLoop = 5 // limit to avoid infinite loop
		let highestFloor = -1
		let loop = 1
		while (loop < maxLoop) {
			let remaining = 0 // count of elements with undeterminated floor number
			for (const element of this.#elementArray) {
				// ignore elements with known floor number
				if (element.floor > -1)
					continue
				let currentFloor = 0 // by default set to ground floor
				for (const parentElement of element.parents) {
					// can not determine element floor number if parent floor number is unknown
					if (parentElement.floor == -1) {
						currentFloor = -1
						break
					}
					// curent floor is always a level above higest parent floor
					if (currentFloor <= parentElement.floor)
						currentFloor = parentElement.floor + 1
				}
				if (currentFloor > -1)
					element.floor = currentFloor
				else	
					remaining++;
				if (highestFloor < currentFloor)
					highestFloor = currentFloor
			}
			// exit loop if all element floor have been determined
			if (remaining === 0)
				break
			loop ++
		}
		assert(loop < maxLoop)
		assert(highestFloor !== -1)

		// for each floor, initialize an array containing elements on this floor
		for (let floor = 0; floor <= highestFloor; floor++) {
			const floorElementArray = []
			for (const element of this.#elementArray) {
				if (element.floor != floor)
					continue
				floorElementArray.push(element)
			}
			this.#floorArray.push(floorElementArray)
		}

		// print a report
		if (false) {
			let floor = -1
			for (const floorElementArray of this.#floorArray){
				floor++
				console.log("Floor n°", floor)
				for (const element of floorElementArray)
					console.log("- element", element.name)
			}
		}

	}

	static async query(filters) {
		assert(filters !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		return null;
	}

}

module.exports = () => {
	SelectorModel.initialize();
	return SelectorModel;
}

