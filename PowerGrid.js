
class PowerGrid { // a group of things connected by power lines
    constructor() {
        this.gridIndex = allPowerGrids.length;
        this.allStructures = [];
        this.allExtractors = [];

        this.powerSupplyMax = 0;
        this.powerSupply = 0;
        this.powerGeneration = 0;
        this.powerConsumption = 0;
        this.maintenanceCost = 0;
    }

    Update() {
        this.powerConsumption = 0;
        this.maintenanceCost = 0;
        this.powerSupplyMax = 0;
        this.powerGeneration = 0;
        this.allStructures.forEach(structure => {
            this.AddStatsOfStructure(structure);
        });

        if(this.powerSupply > this.powerSupplyMax){
            this.powerSupply = this.powerSupplyMax;
        }
    }

    Tick() {
        // generates power
        this.powerSupply += this.powerGeneration;
        if (this.powerSupply > this.powerSupplyMax) {
            this.powerSupply = this.powerSupplyMax;
        }

        // depletes power from grids for money
        let powerConsumed = 0;
        if (this.powerSupply >= this.powerConsumption) {
            powerConsumed = this.powerConsumption;
            this.powerSupply -= this.powerConsumption;
        }
        else {
            powerConsumed = this.powerSupply;
            this.powerSupply = 0;
        }
        // console.log("consumed " + powerConsumed + " power");
        money += powerConsumed;

    }

    AddStructure(newStructure) {
        this.allStructures.push(newStructure);
        this.AddStatsOfStructure(newStructure);

        switch(newStructure.structDesignation){
            case "city":
            case "solarPanel":
            case "powerLine":
                break;
            case "extractionSite":
                this.allExtractors.push(newStructure);
                break;
        }
    }

    AddStatsOfStructure(newStructure){
        switch (newStructure.structType) {
            case "city":
                this.powerConsumption += newStructure.consumption;
                this.powerSupplyMax += newStructure.powerStorage;
                break;
            case "powerLine":
                this.maintenanceCost += newStructure.maintenanceCost;
                break;
            case "solarPanel":
                this.powerGeneration += newStructure.powerProduction;
                break;
            case "extractionSite":
                switch(newStructure.resource.resourceType){
                    case "oil":
                        this.oilGeneration += newStructure.extractionSpeed;
                        break;
                }
                break;
        }
    }
}
