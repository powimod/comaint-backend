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

	static randomParentId = (id) => {
		return parseInt(Math.random() * 1000)
	}
	static randomChildrenCount = (id) => {
		return parseInt(Math.random() * 1000)
	}

	static parcFamilyCount = (parentFilters) => {
		console.log('dOm filters', parentFilters)
		return 222;
	}

	static #elementList = {
		'parc-family': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.parcFamilyCount
		},
		'parc-type': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'parc-equipment': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'parc-unit': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'parc-section': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'workorder': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'intervention': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'stock-category': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'stock-subcategory': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'stock-article': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'stock-unit': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'stock-section': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		},
		'nomenclature': {
			findParentIdFunction: this.randomParentId,
			findChildrenCountFunction: this.randomChildrenCount
		}
	}

	static #linkArray = [
		{ source: 'parc-type',    target: 'parc-family' },
		{ source: 'parc-equipment',         target: 'parc-type' },
		{ source: 'parc-section', target: 'parc-unit' },
		{ source: 'parc-equipment',         target: 'parc-section' },

		{ source: 'workorder',         target: 'parc-equipment' },
		{ source: 'intervention',      target: 'parc-equipment' },

		{ source: 'stock-subcategory', target: 'stock-category' },
		{ source: 'stock-article',             target: 'stock-subcategory' },
		{ source: 'stock-section',     target: 'stock-unit' },
		{ source: 'stock-article',             target: 'stock-section' },

		{ source: 'nomenclature',     target: 'stock-article' },
		{ source: 'nomenclature',     target: 'parc-equipment' },
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
			assert(typeof(element.findParentIdFunction) == 'function')
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

		/* TODO cleanup
		let floor = -1
		for (const floorElementArray of this.#floorArray){
			floor++
			console.log("Floor n°", floor)
			for (const element of floorElementArray)
				console.log("- element", element.name)
		}
		*/
	}


	static async query(selectors) {
		assert(selectors !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		console.log("dOm selectors: ", selectors)

		// initialize result array
		const resultList = {}
		for (const element of this.#elementArray) {
			const result = {
				name: element.name,
				type: null // unknown
			}
			const elementFilterValue = selectors[element.name]
			if (elementFilterValue !== undefined) {
				if (isNaN(elementFilterValue))
					throw new Error(`Filter ${element.name} value is not a number`)
				result.type = 'selector'
				result.id = parseInt(elementFilterValue)
			}
			resultList[element.name] = result
		}


		//===== find element ID from children known element ID
		// for each floor from highest to lowest
		for (let floor = this.#floorArray.length-1; floor >= 0; floor--) {
			const floorElementArray = this.#floorArray[floor]
			// for each element on this floor
			for (const element of floorElementArray) {
				const result = resultList[element.name]
				assert(result !== undefined)
				// ignore element if its result is already known
				if (result.type !== null)
					continue
				let elementId = null
				// for each child of the current element
				for (const childElement of element.children) {
					const childResult = resultList[childElement.name]
					assert(childResult.type !== undefined)
					if (childResult.type === null)
						continue
					assert(childResult.id !== undefined)
					assert(typeof(element.findParentIdFunction) == 'function')
					const parentId = element.findParentIdFunction(childResult.id)
					if (elementId !== null && elementId !== parentId)
						throw new Error(`Different ID found for element ${element.name}`)
					elementId = parentId
				}
				if (elementId === null) 
					continue
				result.type = 'element'
				result.id = elementId
			}
		}

		const recursivelyBuildParentFilters = (elementResult) => {
			assert(typeof(elementResult) == 'object')
			const element = this.#elementList[elementResult.name]
			assert(element !== undefined)
			const filters = []
			if (elementResult.id !== undefined) {
				const name =  elementResult.name
				const id =  elementResult.id 
				filters.push( { name : id } )
			}
			else {
				for (const parentElement of element.parents) {
					const parentElementResult = resultList[parentElement.name]
					assert(parentElementResult !== undefined)
					const parentFilters = recursivelyBuildParentFilters(parentElementResult)
					for (const filter of parentFilters)
						filters.push(filter)
				}
			}
			return filters 
		}

		// for each floor from lowest to highest 
		for (let floor = 0 ; floor < this.#floorArray.length; floor++) {
			const floorElementArray = this.#floorArray[floor]
			// for each element on this floor
			for (const element of floorElementArray) {
				const result = resultList[element.name]
				assert(result !== undefined)
				// ignore element if its result is already known
				if (result.type !== null)
					continue
				const parentFilters = recursivelyBuildParentFilters(result)
				assert(typeof(element.findChildrenCountFunction) == 'function')
				result.type = 'counter'
				result.count = element.findChildrenCountFunction(parentFilters)
			}
		}

		return Object.values(resultList)
	}

}

module.exports = () => {
	SelectorModel.initialize();
	return SelectorModel;
}

