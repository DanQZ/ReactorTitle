
class WorldTile {
	constructor(tileTypeArg, xyArg) {
		this.XY = xyArg;
		this.pixelXY = [xyArg[0] * tilePixelInterval, xyArg[1] * tilePixelInterval];
		this.tileType = tileTypeArg;

		this.resource = null;
		this.mainStructure = null; // only 1 of main building on tile
		this.infrastructure = null; // can have multiple types of infrastructure on 1 tile

		this.cityGrowthMultiplier; // lower = nobody wants to live there + more maintenance cost


		// defaults all to 1x

		this.maintenanceMultiplier = 1;

		this.solarMultiplier = 1;
		this.windMultiplier = 1;
		this.hydroMultiplier = 1;
		this.geoThermalMultiplier = 1;

		this.cityGrowthMultiplier = 1;
		this.adjCityGrowthMultiplier = 1;
		this.researchMultiplier = 1;


		switch (tileTypeArg) {
			case "plains":
				this.maintenanceMultiplier = 1; // relatively peaceful

				this.solarMultiplier = 1;
				this.windMultiplier = 1.5;

				this.hydroMultiplier = 0; // cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 1;
				this.researchMultiplier = 1;
				break;
			case "river":
				this.maintenanceMultiplier = 2;

				this.solarMultiplier = 1;
				this.windMultiplier = 1;

				this.hydroMultiplier = 1;
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0; // cant build city on river
				this.researchMultiplier = 1;
				break;
			case "desertHot":
				this.maintenanceMultiplier = 2;

				this.solarMultiplier = 2.5;
				this.windMultiplier = 1.25;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.66;
				this.researchMultiplier = 1.5;
				break;
			case "desertCold":
				this.maintenanceMultiplier = 5;

				this.solarMultiplier = 0.66;
				this.windMultiplier = 1.5;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.1;
				this.researchMultiplier = 5;
				break;
			case "waterfall":
				this.maintenanceMultiplier = 5; // water spray? lol

				this.solarMultiplier = 1;
				this.windMultiplier = 1.25;

				this.hydroMultiplier = 10; // massive
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0; // cant build
				this.researchMultiplier = 0; // cant build
				break;
			case "mountains":
				this.maintenanceMultiplier = 5;

				this.solarMultiplier = 1.25;
				this.windMultiplier = 2;

				this.hydroMultiplier = 0; // cant build
				this.geoThermalMultiplier = 1;

				this.cityGrowthMultiplier = 0.1;
				this.researchMultiplier = 4;
				break;
			case "volcano":
				this.maintenanceMultiplier = 10;

				this.solarMultiplier = 1.25;
				this.windMultiplier = 2;

				this.hydroMultiplier = 0;// cant build
				this.geoThermalMultiplier = 20; // massive

				this.cityGrowthMultiplier = 0; // cant build
				this.researchMultiplier = 20; // massive
				break;
		}
	}

	Update() {

	}
}