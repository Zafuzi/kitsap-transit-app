class Map {
	//CONSTRUCTOR
	constructor(el, key, location, zoom) {
		this.el = el;
		this.key = key;
		this.location = location;
		this.zoom = zoom;
	}

	_createMap() {
		var self = this;
		L.mapbox.accessToken = self.key;
		mapLayer = L.mapbox.map(self.el, 'mapbox.streets')
			.setView(self.location, self.zoom);
		//loadAgencies();
	}
}
