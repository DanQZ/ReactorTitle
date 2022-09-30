class ExtractionSiteStructure extends Structure{
    constructor(parentTile){
        super(parentTile);
        this.structureImage = extractorImage;

        this.baseBuildPrice = 100;

        this.structCategory = "mainStructure";
        this.structDesignation = "extractionSite";

        this.resource = null;
        this.extractionSpeed = 1;
    }

    Init(){
        if(this.parentTile.resource != null){
            console.log("good job it is now extracting shit out of the ground");
        }
        else{
            console.log("you put it on a tile with nothing to extract dumbass");
        }

		allExtractors.push(this);
		AddToPowerGrid(this);
		this.Update();
    }

    UpdateSelf(){
        if(this.parentTile.resource != null){
            this.resource = this.parentTile.resource;
        }
    }
}