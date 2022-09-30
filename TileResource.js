class TileResource{
    constructor(resourceTypeArg, resourceAmountArg, parentTileArg) {
        this.parentTile = null;
        if(parentTileArg){
            this.parentTile = parentTileArg;
            this.parentTile.resource = this;
        }
        this.image = null;
        this.resourceType = "none";
        if (resourceTypeArg){
            this.resourceType = resourceTypeArg;
        }
        this.resourceAmount = resourceAmountArg;

        switch (this.resourceType) {
            case "coal":
                
                break;
            case "oil":
                this.image = oilImage;
                break;
            case "uranium":
                break;
            case "plutonium":
                break;
            case "thorium":
                break;
            case "veryrareandhardtogetium":
                break;
        }
    }
}