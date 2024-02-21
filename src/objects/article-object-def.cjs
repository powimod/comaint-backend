/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * article-object-def.cjs
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


const articleObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"name" : {
		"type": "string",
		"minimum": "2",
		"maximum": "128",
		"mandatory": "true",
	},
	"description" : {
		"type": "string",
		"maximum": "256",
		"mandatory": "false",
	},
	"localisation" : {
		"type": "string",
		"maximum": "32",
		"mandatory": "false",
	},
	"reference" : {
		"type": "string",
		"maximum": "32",
		"mandatory": "false",
	},
	"stockQuantity" : {
		"type": "integer",
		"field": "stock_quantity",
		"minimum": "0",
		"maximum": "127",
		"default": "0",
		"mandatory": "true",
	},
	"reservedQuantity" : {
		"type": "integer",
		"field": "reserved_quantity",
		"minimum": "0",
		"maximum": "127",
		"default": "0",
		"mandatory": "true",
	},
	"orderQuantity" : {
		"type": "integer",
		"field": "order_quantity",
		"minimum": "0",
		"maximum": "127",
		"default": "0",
		"mandatory": "true",
	},
	"minimumQuantity" : {
		"type": "integer",
		"field": "minimum_quantity",
		"minimum": "0",
		"maximum": "127",
		"default": "0",
		"mandatory": "true",
	},
	"quantityToOrder" : {
		"type": "integer",
		"field": "quantity_to_order",
		"minimum": "0",
		"maximum": "127",
		"default": "0",
		"mandatory": "true",
	}, 
	"articleSubCategoryId" : {
		"type": "link",
		"target" : "ArticleSubCategory",
		"field" : "id_article_sub_category",
		"table" : "article_subcategories"
	}, 
	"sectionId" : {
		"type": "link",
		"target" : "Section",
		"field" : "id_section",
		"table" : "sections"
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	articleObjectDef
}
