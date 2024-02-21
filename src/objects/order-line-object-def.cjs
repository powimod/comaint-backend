/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * order-line-object-def.cjs
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


const orderLineObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"price" : {
		"type": "price",
		"mandatory": "false",
	},
	"orderQuantity" : {
		"type": "integer",
		"field": "order_quantity",
		"minimum": "1",
		"maximum": "127",
		"default": "1",
		"mandatory": "true",
	},
	"receivedQuantity" : {
		"type": "integer",
		"field": "received_quantity",
		"minimum": "0",
		"maximum": "127",
		"default": "0",
		"mandatory": "true",
	}, 
	"orderId" : {
		"type": "link",
		"target" : "Order",
		"field" : "id_order",
		"table" : "orders"
	}, 
	"articleId" : {
		"type": "link",
		"target" : "Article",
		"field" : "id_article",
		"table" : "articles"
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	orderLineObjectDef
}
