//the stripe package is only for backend, Stripe() is the global obj returned from the stripe's cdn we used on the frontend(tour.pug)
import axios from 'axios'
import { showAlert } from './alert'

//This key is the public key that we should pass from frontend.
const stripe = Stripe(
  'pk_test_51KY0q7SCRw9YrTeDRgCfVj2oHVcOG3GJaQdIGn95gt25CegKig0N7tj1Y5IfedCbUWbzFEy5cwPF6wZFzXQXC7Ls00KweqNzyn'
)

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from the API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    )

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    })
  } catch (err) {
    console.log(err)
    showAlert('error', err)
  }
}
