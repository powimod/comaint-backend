// TODO use pwm-code-gen config (user email, password hardcoded)

const userHelper = require('../src/objects/user-object-helper.cjs')

var expect = require('chai').expect;
//let chai = require('chai');

describe('Test UserHelper functions', () => {


	describe('Test id control', () => {
		it('Should detect missing argument', () => {
			const result = userHelper.controlPropertyId()
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_not_defined : {"property":"id"}`)
		})
		it('Should detect wrong type argument', () => {
			const result = userHelper.controlPropertyId("abc")
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_not_an_integer : {"property":"id"}`)
		})
		it('Should detect wrong type argument', () => {
			const result = userHelper.controlPropertyId(null)
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_null : {"property":"id"}`)
		})
		it('Expect to accept wellformed ID', () => {
			const result = userHelper.controlPropertyId(1234)
			expect(result).to.be.a('boolean')
		})

	}),

	describe('Test email control', () => {
		it('Should detect missing argument', () => {
			const result = userHelper.controlPropertyEmail()
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_not_defined : {"property":"email"}`)
		})
		it('Should detect wrong type argument', () => {
			const result = userHelper.controlPropertyEmail(152)
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_not_a_string : {"property":"email"}`)
		})
		it('Expect to detect too small email', () => {
			const result = userHelper.controlPropertyEmail("ab")
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.is_too_short/);
		})
		it('Expect to detect malformed email', () => {
			const result = userHelper.controlPropertyEmail("abcd")
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.is_malformed_email/);
		})
		it('Expect to accept wellformed email', () => {
			const result = userHelper.controlPropertyEmail("a@b.c")
			expect(result).to.be.a('boolean')
		})
	}),

	describe('Test password control', () => {
		it('Should detect missing argument', () => {
			const result = userHelper.controlPropertyPassword()
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_not_defined : {"property":"password"}`)
		})
		it('Should detect non string argument', () => {
			const result = userHelper.controlPropertyPassword(152)
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.equal(`error.prop.is_not_a_string : {"property":"password"}`)
		})
		it('Expect to detect too small password', () => {
			const result = userHelper.controlPropertyPassword("ab")
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.is_too_short/);
		})
		it('Expect to detect missing lower case letter in password', () => {
			const result = userHelper.controlPropertyPassword('ABCDEF+12346')
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.password_no_lowercase_letter/);
		})
		it('Expect to detect missing upper case letter in password', () => {
			const result = userHelper.controlPropertyPassword('abcdef+12346')
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.password_no_uppercase_letter/);
		})
		it('Expect to detect missing digit character letter in password', () => {
			const result = userHelper.controlPropertyPassword('abcdef+ABCDE')
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.password_no_digit_character/);
		})
		it('Expect to detect missing special  character letter in password', () => {
			const result = userHelper.controlPropertyPassword('abcdef0ABCDE')
			expect(result).to.not.be.a('boolean')
			expect(result).to.be.a('string').and.match(/^error.prop.password_no_special_character/);
		})
	})

})
