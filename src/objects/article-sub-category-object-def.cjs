/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-sub-category-object-def.cjs
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


const articleSubCategoryObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"name" : {
		"type": "string",
		"minimum": "2",
		"maximum": "32",
		"mandatory": "true",
	}, 
	"categoryId" : {
		"type": "link",
		"target" : "ArticleCategory",
		"field" : "id_category",
		"table" : "article_categories"
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	articleSubCategoryObjectDef
}
