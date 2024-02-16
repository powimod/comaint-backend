/* Comaint Single Page Application frontend (Single page application frontend of Comaint project)
 * Copyright (C) 2023-2024 Dominique Parisot
 *
 * user-object-def.cjs
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


const userObjectDef = {
	"id" : {
		"type": "id",
		"mandatory": "true",
	},
	"email" : {
		"type": "email",
		"minimum": "3",
		"maximum": "128",
		"mandatory": "true",
	},
	"password" : {
		"type": "string",
		"minimum": "8",
		"maximum": "70",
		"mandatory": "true",
		"secret": "true",
	},
	"firstname" : {
		"type": "string",
		"maximum": "30",
		"mandatory": "true",
	},
	"lastname" : {
		"type": "string",
		"maximum": "30",
		"mandatory": "true",
	},
	"accountLocked" : {
		"type": "boolean",
		"field": "account_locked",
		"default": "false",
		"mandatory": "true",
	},
	"validationCode" : {
		"type": "integer",
		"field": "validation_code",
		"minimum": "10000",
		"maximum": "99999",
		"default": "10000",
		"mandatory": "false",
	},
	"phone" : {
		"type": "string",
		"maximum": "25",
		"default": "",
		"mandatory": "false",
	},
	"active" : {
		"type": "boolean",
		"default": "true",
		"mandatory": "true",
	},
	"lastUse" : {
		"type": "datetime",
		"field": "last_use",
		"mandatory": "false",
	},
	"administrator" : {
		"type": "boolean",
		"default": "false",
		"mandatory": "true",
	},
	"stockRole" : {
		"type": "integer",
		"field": "stock_role",
		"minimum": "0",
		"maximum": "4",
		"default": "0",
		"mandatory": "false",
	},
	"parkRole" : {
		"type": "integer",
		"field": "park_role",
		"minimum": "0",
		"maximum": "4",
		"default": "0",
		"mandatory": "false",
	}, 
	"companyId" : {
		"type": "link",
		"target" : "Company",
		"field" : "id_company",
		"table" : "companies"
	},
}

module.exports = {
	userObjectDef
}
