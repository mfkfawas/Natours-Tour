/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alert'

export const login = async (email, password) => {
  try {
    // var headers = new Headers()
    // headers.append('Content-Type', 'application/json')
    // headers.append('Accept', 'application/json')
    const res = await axios({
      method: 'POST',
      withCredentials: true,
      // headers,
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    })
    console.log(res.data)

    // let response = await fetch('http://127.0.0.1:3000/api/v1/users/login', {
    //   method: 'POST',
    //   // mode: 'same-origin',
    //   // redirect: 'follow',
    //   credentials: 'include', // Don't forget to specify this if you need cookies
    //   headers,
    //   body: JSON.stringify({ email, password }),
    // })
    // let data = await response.json()
    // console.log(data)

    // const res = await axios({
    //   method: 'POST',
    //   url: 'http://127.0.0.1:3000/api/v1/users/login',
    //   data: {
    //     email,
    //     password,
    //   },
    // })

    //checking whether our API call is successful.(rem we Jsend status: success to our every API resp)
    if (res.data.success === true) {
      // localStorage.setItem('user', JSON.stringify(res.data))

      showAlert('success', 'Logged In Successfully')
      // After 1.5s loading the homepage, coz after reloading only the user data is loaded to the header.
      window.setTimeout(() => {
        // Inorder to load a page.
        location.assign('/')
      }, 1500)
    }
  } catch (error) {
    //axios's error obj
    showAlert('error', error.response.data.message)
  }
}

export const logout = async () => {
  try {
    // localStorage.removeItem('user')

    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    })
    console.log(res.data)

    if (res.data.status === 'success') {
      //true - reload from server, not from browser cache.
      // location.reload(true)

      // Inorder to load a page.
      location.assign('/')
    }
  } catch (error) {
    showAlert('error', 'Error Logging Out! Try Again!')
  }
}
