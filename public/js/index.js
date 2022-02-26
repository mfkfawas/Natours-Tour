/* eslint-disable */
//This file is our entry-file(frontend), here we get data from UI and then we delegate actions
//to some fns coming from other files like login.js, alert.js,...
import axios from 'axios'
import '@babel/polyfill'
import { displayMap } from './mapbox'
import { login, logout } from './login'
import { updateSettings } from './updateSettings'

// DOM ELEMENTS
const mapBox = document.querySelector('#map')
const loginForm = document.querySelector('.form--login')
const logoutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')

// DELEGATION
// if other than tour.pug(where map is displayed) is rendered we dont wann run the block below.
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations)
  displayMap(locations)
}

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    login(email, password)
  })

if (logoutBtn) logoutBtn.addEventListener('click', logout)

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //Chapter 203(Here we are creating a multi-part form data)
    const form = new FormData()
    form.append('name', document.getElementById('name').value)
    form.append('email', document.getElementById('email').value)
    //.files return an array, since there is only one...
    form.append('photo', document.getElementById('photo').files[0])

    //our AJAX call using axios will auto recognize 'form' as object.
    updateSettings(form, 'data')
  })
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    document.querySelector('.btn-save-password').textContent = 'Updating...'
    const passwordCurrent = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    )

    document.querySelector('.btn-save-password').textContent = 'save password'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
  })
}
