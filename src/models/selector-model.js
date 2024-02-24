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

	// TODO cleanup
	static randomParentId = (id) => {
		return parseInt(Math.random() * 1000)
	}

	// TODO cleanup
	static randomChildrenCount = (id) => {
		return parseInt(Math.random() * 1000)
	}

	// TODO cleanup
	static randomInfo = (id) => {
		return "ABCDEF " + parseInt(Math.random() * 1000)
	}

	/*================ Info function ====================*/
	static findCompanyInfo = async (id) => {
		const model = this.#model.getCompanyModel()
		const company = await model.getCompanyById(id)
		if (company === null)
			return 'Not found'; // FIXME translation
		return company.name	
	}

	static findParcFamilyInfo = async (id) => {
		const model = this.#model.getEquipmentFamilyModel()
		const equipmentFamily = await model.getEquipmentFamilyById(id)
		if (equipmentFamily === null)
			return 'Not found'; // FIXME translation
		return equipmentFamily.name	
	}

	static findParcTypeInfo = async (id) => {
		const model = this.#model.getEquipmentTypeModel()
		const equipmentType = await model.getEquipmentTypeById(id)
		if (equipmentType === null)
			return 'Not found'; // FIXME translation
		return equipmentType.name	
	}

	static findParcEquipmentInfo = async (id) => {
		const model = this.#model.getEquipmentModel()
		const equipment = await model.getEquipmentById(id)
		if (equipment === null)
			return 'Not found'; // FIXME translation
		return equipment.name	
	}

	static findUnitInfo = async (id) => {
		const model = this.#model.getUnitModel()
		const unit = await model.getUnitById(id)
		if (unit === null)
			return 'Not found'; // FIXME translation
		return unit.name	
	}

	static findSectionInfo = async (id) => {
		const model = this.#model.getSectionModel()
		const section = await model.getSectionById(id)
		if (section === null)
			return 'Not found'; // FIXME translation
		return section.name	
	}

	static findStockCategoryInfo = async (id) => {
		const model = this.#model.getArticleCategoryModel()
		const stockCategory = await model.getArticleCategoryById(id)
		if (stockCategory === null)
			return 'Not found'; // FIXME translation
		return stockCategory.name	
	}

	static findStockSubCategoryInfo = async (id) => {
		const model = this.#model.getArticleSubCategoryModel()
		const subCategory = await model.getArticleSubCategoryById(id)
		if (subCategory === null)
			return 'Not found'; // FIXME translation
		return subCategory.name	
	}

	static findStockArticleInfo = async (id) => {
		const model = this.#model.getArticleModel()
		const article = await model.getArticleById(id)
		if (article === null)
			return 'Not found'; // FIXME translation
		return article.name	
	}



	/*================ Find Parent ID function ====================*/


	static findCompanyParentId = async (id, parentName) => {
		console.error('Should never be called')
		return -1
	}


	static findParcFamilyParentId = async (id, parentName) => {
		const model = this.#model.getEquipmentFamilyModel()
		const equipmentFamily = await model.getEquipmentFamilyById(id)
		if (equipmentFamily === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'company':
				parentId = equipmentFamily.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}


	static findParcTypeParentId = async (id, parentName) => {
		const model = this.#model.getEquipmentTypeModel()
		const equipmentType = await model.getEquipmentTypeById(id)
		if (equipmentType === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'parc-family':
				parentId = equipmentType.equipmentFamilyId
				break;
			case 'company':
				parentId = equipmentType.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}


	static findParcEquipmentParentId = async (id, parentName) => {
		const model = this.#model.getEquipmentModel()
		const equipment = await model.getEquipmentById(id)
		if (equipment === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'parc-type':
				parentId = equipment.equipmentTypeId
				break;
			case 'parc-section':
				parentId = equipment.sectionId
				break;
			case 'company':
				parentId = equipment.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}

	static findUnitParentId = async (id, parentName) => {
		const model = this.#model.getUnitModel()
		const unit = await model.getUnitById(id)
		if (unit === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'company':
				parentId = unit.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}

	static findSectionParentId = async (id, parentName) => {
		const model = this.#model.getSectionModel()
		const section = await model.getSectionById(id)
		if (section === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'stock-unit':
			case 'parc-unit':
				parentId = section.unitId
				break;
			case 'company':
				parentId = section.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}


	static findStockArticleParentId = async (id, parentName) => {
		const model = this.#model.getArticleModel()
		const article = await model.getArticleById(id)
		if (article === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'stock-subcategory':
				parentId = article.articleSubCategoryId
				break;
			case 'stock-section':
				parentId = article.sectionId
				break;
			case 'company':
				parentId = article.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}

	static findStockCategoryParentId = async (id, parentName) => {
		const model = this.#model.getArticleCategoryModel()
		const category = await model.getArticleCategoryById(id)
		if (category === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'company':
				parentId = category.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}


	static findStockSubcategoryParentId = async (id, parentName) => {
		const model = this.#model.getArticleSubCategoryModel()
		const subcategory = await model.getArticleSubCategoryById(id)
		if (subcategory === null)
			return 'Not found'; // FIXME translation
		let parentId = -1
		switch (parentName) {
			case 'stock-category':
				parentId = subcategory.categoryId
				break;
			case 'company':
				parentId = subcategory.companyId
				break;
			default:
				console.error(`Unknown parent name [${parentName}]`)
		}
		return parentId
	}



	/*================ Count function ====================*/
	static findCompanyCount = async (id) => {
		console.error('findCompanyCount should never be called')
		return 1;
	}

	static findParcFamilyCount = async (parentFilters) => {
		const model = this.#model.getEquipmentFamilyModel()
		return await model.findEquipmentFamilyCount(parentFilters)
	}

	static findParcTypeCount = async (parentFilters) => {
		const model = this.#model.getEquipmentTypeModel()
		return await model.findEquipmentTypeCount(parentFilters)
	}

	static findParcEquipmentCount = async (parentFilters) => {
		const model = this.#model.getEquipmentModel()
		return await model.findEquipmentCount(parentFilters)
	}

	static findUnitCount = async (parentFilters) => {
		const model = this.#model.getUnitModel()
		return await model.findUnitCount(parentFilters)
	}

	static findSectionCount = async (parentFilters) => {
		const model = this.#model.getSectionModel()
		return await model.findSectionCount(parentFilters)
	}

	static findStockCategoryCount = async (parentFilters) => {
		const model = this.#model.getArticleCategoryModel()
		return await model.findArticleCategoryCount(parentFilters)
	}

	static findStockSubcategoryCount = async (parentFilters) => {
		const model = this.#model.getArticleSubCategoryModel()
		return await model.findArticleSubCategoryCount(parentFilters)
	}

	static findStockArticleCount = async (parentFilters) => {
		const model = this.#model.getArticleModel()
		return await model.findArticleCount(parentFilters)
	}

	static findNomenclatureCount = async (parentFilters) => {
		const model = this.#model.getNomenclatureModel()
		return await model.findNomenclatureCount(parentFilters)
	}


	/*================ Element definitions ===============*/

	static #elementList = {
		'company': {
			findParentIdFunction: this.findCompanyParentId,
			findCountFunction: this.findCompanyCount,
			findInfoFunction: this.findCompanyInfo
		},
		'parc-family': {
			findParentIdFunction: this.findParcFamilyParentId,
			findCountFunction: this.findParcFamilyCount,
			findInfoFunction: this.findParcFamilyInfo
		},
		'parc-type': {
			findParentIdFunction: this.findParcTypeParentId,
			findCountFunction: this.findParcTypeCount,
			findInfoFunction: this.findParcTypeInfo
		},
		'parc-equipment': {
			findParentIdFunction: this.findParcEquipmentParentId,
			findCountFunction: this.findParcEquipmentCount,
			findInfoFunction: this.findParcEquipmentInfo
		},
		'parc-unit': {
			findParentIdFunction: this.findUnitParentId,
			findCountFunction: this.findUnitCount,
			findInfoFunction: this.findUnitInfo
		},
		'parc-section': {
			findParentIdFunction: this.findSectionParentId,
			findCountFunction: this.findSectionCount,
			findInfoFunction: this.findSectionInfo
		},
		'workorder': {
			findParentIdFunction: this.randomParentId, // TODO
			findCountFunction: this.randomChildrenCount,// TODO
			findInfoFunction: this.randomInfo // TODO
		},
		'intervention': {
			findParentIdFunction: this.randomParentId, // TODO
			findCountFunction: this.randomChildrenCount,// TODO
			findInfoFunction: this.randomInfo // TODO
		},
		'stock-category': {
			findParentIdFunction: this.findStockCategoryParentId,
			findCountFunction: this.findStockCategoryCount,
			findInfoFunction: this.findStockCategoryInfo
		},
		'stock-subcategory': {
			findParentIdFunction: this.findStockSubcategoryParentId,
			findCountFunction: this.findStockSubcategoryCount,
			findInfoFunction: this.findStockSubCategoryInfo
		},
		'stock-article': {
			findParentIdFunction: this.findStockArticleParentId,
			findCountFunction: this.findStockArticleCount,
			findInfoFunction: this.findStockArticleInfo
		},
		'stock-unit': {
			findParentIdFunction: this.findUnitParentId,
			findCountFunction: this.findUnitCount,
			findInfoFunction: this.findUnitInfo
		},
		'stock-section': {
			findParentIdFunction: this.findSectionParentId,
			findCountFunction: this.findSectionCount,
			findInfoFunction: this.findSectionInfo
		},
		'nomenclature': {
			findParentIdFunction: this.randomParentId, // TODO
			findCountFunction: this.findNomenclatureCount,
			findInfoFunction: this.randomInfo // TODO
		}
	}

	static #linkArray = [
		{ source: 'parc-family',       target: 'company' },
		{ source: 'parc-type',         target: 'parc-family' },
		{ source: 'parc-equipment',    target: 'parc-type' },
		{ source: 'parc-unit',         target: 'company' },
		{ source: 'parc-section',      target: 'parc-unit' },
		{ source: 'parc-equipment',    target: 'parc-section' },

		{ source: 'workorder',         target: 'parc-equipment' },
		{ source: 'intervention',      target: 'parc-equipment' },

		{ source: 'stock-category' ,   target: 'company' },
		{ source: 'stock-subcategory', target: 'stock-category' },
		{ source: 'stock-article',     target: 'stock-subcategory' },
		{ source: 'stock-unit',        target: 'company' },
		{ source: 'stock-section',     target: 'stock-unit' },
		{ source: 'stock-article',     target: 'stock-section' },

		{ source: 'nomenclature',       target: 'stock-article' },
		{ source: 'nomenclature',       target: 'parc-equipment' },
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

	}


	static async query(selectors) {
		assert(selectors !== undefined);
		assert(this.#model !== null);
		const db = this.#model.db;

		//===== Step n°1 : initialize result array
		const resultList = {}
		for (const element of this.#elementArray) {
			const result = {
				name: element.name,
				type: null // unknown
			}
			const selectorId = selectors[element.name]
			if ( selectorId !== undefined && selectorId !== null) {
				if (isNaN(selectorId))
					throw new Error(`Filter ${element.name} value [${selectorId}] is not a number`)
				result.type = 'selector'
				result.id = parseInt(selectorId)
				result.label = await element.findInfoFunction(selectorId)
			}
			resultList[element.name] = result
		}

		//===== Step n°2 : find element ID from children known element ID
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
					assert(typeof(childElement.findParentIdFunction) == 'function')
					const parentId = await childElement.findParentIdFunction(childResult.id, element.name)
					if (elementId !== null && elementId !== parentId)
						throw new Error(`Different ID found for element ${element.name}`)
					elementId = parentId
				}
				if (elementId === null) 
					continue
				result.type = 'element'
				result.id = elementId
				result.label = await element.findInfoFunction(elementId)
			}
		}

		//===== Step n°3 : build parent filter list
		// for each floor from lowest to highest 
		for (let floor = 0 ; floor < this.#floorArray.length; floor++) {
			const floorElementArray = this.#floorArray[floor]
			// for each element on this floor
			for (const element of floorElementArray) {
				const result = resultList[element.name]
				assert(result !== undefined)

				const filterList = {} 

				if (result.type !== null) {
					// direct filter
					filterList[`${result.name}Id`] = result.id
				}
				else {
					// append parent filters
					for (const parentElement of element.parents) {
						const parentElementResult = resultList[parentElement.name]
						assert(parentElementResult !== undefined)
						const parentFilterList = parentElementResult.parentFilters
						for (var [filterName, filterValue] of Object.entries(parentFilterList) ) {
							filterList[filterName] = filterValue
						}
					}
				}
				result.parentFilters = filterList
			}
		}


		//===== Step n°4 : determine element count
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
				const parentFilters = result.parentFilters
				assert(parentFilters !== undefined)
				assert(typeof(element.findCountFunction) == 'function')
				result.type = 'counter'
				result.count = await element.findCountFunction(parentFilters)
			}
		}

		return Object.values(resultList)
	}

}

module.exports = () => {
	SelectorModel.initialize();
	return SelectorModel;
}

