// finish later
class HeatPipeStructure extends Structure {

	// will use this code for heat spreading instead of power spreading
	/* 
	
	Tick() {

		this.SpreadPower();

		let fairShare = this.powerSupply / this.adjCities.length;

		while (this.AnyAdjCityNeedsPower() && this.powerSupply > 0) { // if any city needs power and this has power left

			this.adjCities.forEach(city => {
				if (city.powerSupply < city.powerSupplyMax) { // the city wants power
					let amountToGive = city.powerSupplyMax - city.powerSupply; // amount city wants
					if (amountToGive > fairShare) { // if city wants more than its fair share
						amountToGive = fairShare;
					}

					if (this.powerSupply >= amountToGive) { // if powerLine has enough power to fill amount wanted
						city.powerSupply += amountToGive;
						this.powerSupply -= amountToGive;
					}
					else {
						city.powerSupply += this.powerSupply;
						this.powerSupply = 0;
					}
				}
			});
		}
	}

	SpreadPower() {
		if (this.powerSupply / this.powerSupplyMax >= 0.98) { // at or very close to max powerSupply

		}
		else {
			this.adjPowerLines.forEach(adjLine => { // spreading power across other power lines
				if (this.powerSupply != adjLine.powerSupply) { // works for both pos and neg power supply diff
					let diff = this.powerSupply - adjLine.powerSupply;
					this.powerSupply -= diff / 2;
					adjLine.powerSupply += diff / 2;
				}
			});
		}
	}

	Update() {
		this.CheckSurroundingTiles();
		UpdateAroundTile(this.parentTile);
	}

	CheckSurroundingTiles() {
		this.adjPowerLines = [];
		this.adjCities = [];

		let adjTiles = GetAdjacentTiles(this.parentTile);
		adjTiles.forEach(tile => {
			if (tile.infrastructure != null) {
				if (tile.infrastructure.structType == "powerLine") {
					console.log("power line found at " + tile.XY[1] + ", " + tile.XY[0]);
					this.adjPowerLines.push(tile.infrastructure);
				}
			}
			if (tile.mainStructure != null) {
				if (tile.mainStructure.structType == "city") {
					console.log("power line found city");
					this.adjCities.push(tile.mainStructure);
				}
			}
		});
	}

	AnyAdjCityNeedsPower() {
		let output = false;
		this.adjCities.forEach(city => {
			if (city.powerSupply < city.powerSupplyMax) {
				output = true;
			}
		});

		return output;
	}
	*/
}