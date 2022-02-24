/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibWZrZmF3YXMiLCJhIjoiY2t6cGpuaTNlM2lxdDJ1bnkyaXp4bDV0NCJ9.57V70J-pXt5HMDgX_k7x4Q'

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mfkfawas/ckzptx5pc001814lf5yy6qyzf', // style URL
    // scrollZoom: false,
    // center: [-74.5, 40], // starting position [lng, lat]
    // zoom: 9, // starting zoom
  })

  // This bounds object is the area that will be displayed on the map.
  const bounds = new mapboxgl.LngLatBounds()

  locations.forEach((loc) => {
    //Create Marker
    const el = document.createElement('div')
    el.className = 'marker'

    //Adding a new marker inside of mapbox.
    new mapboxgl.Marker({
      element: el,
      //bottom of the el(pin) which is going to be located at the exact gps location.
      anchor: 'bottom',
      //rem coordinates is an arr of longitude and latitude respectively, that's exactly what mapbox want.
    })
      .setLngLat(loc.coordinates)
      .addTo(map)

    //Add popup
    new mapboxgl.Popup({
      offset: 40,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map)

    //extend the map bound to include the current location.
    bounds.extend(loc.coordinates)
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  })
}
