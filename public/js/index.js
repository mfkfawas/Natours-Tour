/* eslint-disable */
//This file is our entry-file(frontend), here we get data from UI and then we delegate actions
//to some fns coming from other files like login.js, alert.js,...
import axios from 'axios'
import '@babel/polyfill'
import { displayMap } from './mapbox'
import { login, logout } from './login'

// DOM ELEMENTS
const mapBox = document.querySelector('#map')
const loginForm = document.querySelector('.form')
const logoutBtn = document.querySelector('.nav__el--logout')

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
