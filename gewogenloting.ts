window.addEventListener('DOMContentLoaded', () => { Main.Init() });


/** Function numberToBase26 by CodeKonami: https://stackoverflow.com/questions/45787459/convert-number-to-alphabet-string-javascript/45787487 */
function numberToBase26(integerValue: number, tail = ''): string {
    if (integerValue <= 26) {
        return `${String.fromCharCode(integerValue + 64)}${tail}`;
    }
    let remainder = integerValue % 26 || 26;
    let division = Math.floor(integerValue / 26) - (remainder === 26 ? 1 : 0);
    return numberToBase26(division, `${String.fromCharCode(remainder + 64)}${tail}`);
}

/**** HTML accessors *****/
function getInputElement(id: string): HTMLInputElement { return document.getElementById(id) as HTMLInputElement }
function getDivElement(id: string): HTMLDivElement { return document.getElementById(id) as HTMLDivElement }
function getPreElement(id: string): HTMLPreElement { return document.getElementById(id) as HTMLPreElement }
/**** HTML accessors *****/

function rndFromArr<T>(anArray: T[]): T {
    return anArray[Math.floor(Math.random() * anArray.length)];
}


class Main {
    static Init() {
        console.log("GewogenLoting.nl by Joep Bos-Coenraad (/dev/nl)");
        console.log("TypeScript source available at github.com/JoepBC/gewogenloting.nl");

        new Main();
    }

    static DelUnit(id: string) {
        this.I.participants.removeParticipant(id);
        this.I.refresh();
    }

    static I: Main;

    /** The users to divide the spaces on the lots over */
    participants: Participants;
    /** The lots to be printed/published in advance and
      * to select on from manually afterwards, 
      * by rolling dice / bingo / etc. */
    lots: Lots;

    constructor() {
        this.assignInput();
        this.participants = Participants.I;
        this.lots = Lots.I;
        Main.I = this;
    }

    /** Attach some functionality to the buttons in the HTML */
    assignInput() {
        getInputElement('add_participant').onclick = () => { this.addChance() }
        getInputElement('lots_refresh').onclick = () => { this.refresh() }
    }

    addChance() {
        /* Read input form values */
        let partID = getInputElement("part_id").value;
        let partChance = getInputElement("part_chance").value;

        /* Add new participant to the participants list HTML */
        if (this.participants.idExists(partID)) {
            alert("Kies een nieuw ID. Naam/id '" + partID + "' bestaat al.");
        } else
            this.participants.addParticipant(partID, Number(partChance));

        this.refresh();
    }

    refresh() {
        /* Check for new settings. */
        this.updateInputFields();

        /* Update participations list. */
        this.participants.updateList();

        /* Delete old lots and create clean lots list */
        this.lots.clear();

        /* Refresh pools */
        this.participants.fillPools();
        /* Display the participants */
        this.participants.visualisePools();

        /* Populate the spaces on the lots from the pool */
        this.participants.populateLots();
        /* Display the lots */
        this.lots.visualiseLots();
    }

    updateInputFields() {
        Lots.I.lotsBase = Number(getInputElement("lotCount").value);
        Lots.I.lotSpaces = Number(getInputElement("lotSpaces").value);
        Lots.I.lotsMultiplier = Number(getInputElement("lotMultiplier").value);

    }

}

/*****************************************************************************
 ********************************* LOTS **************************************
 *****************************************************************************/

class Lots {
    list: Lot[] = [];
    private constructor() { };
    static Instance = new Lots();
    static get I() { return this.Instance }

    static FailedAttempts = 0;
    static MaxFailedAttempts = 10000;

    lotsBase: number = 10;
    get lotsRequired() { return Math.pow(this.lotsBase, this.lotsMultiplier) }
    lotSpaces = 5;
    lotsMultiplier = 1;

    /** count al lots and spaces (regardless the spaces being filled) */
    get totalSpaceCount() {
        // if Lots haven't been created yet:
        if (this.list.length == 0)
            return this.lotSpaces * this.lotsRequired;
        // when lots have been created, use their actual sizes:
        let totalSpaces = 0;
        this.list.forEach(lot => {
            totalSpaces += lot.spaceCount;
        });
        return totalSpaces;
    }

    /** When 'exponent' value is > 1, we want to split the lot numbers/identifiers up,
     *  to allow for several draws to produce a combined lot id. */
    static splitLotNumber(val: number, base: number, splitCount: number) {
        let tArr = [];
        for (let i = splitCount; i >= 1; i--) {
            let jx = Math.floor(val / (Math.pow(base, i - 1)));
            val = val - (jx * (Math.pow(base, i - 1)));
            tArr.push(jx + 1);
        }
        return tArr.join('-');
    }

    splitLotNumber(val: number) {
        return Lots.splitLotNumber(val, this.lotsBase, this.lotsMultiplier);
    }

    /** How many lots exist that have no space left? */
    getFullLotCount(excludeId?: string): number {
        let retVal = 0;
        for (let aLot of this.list) {
            if (!aLot.hasSpaceLeft) retVal++;
        }
        return retVal;
    }

    /** Cleanup the list before creating a new one. */
    clear() {
        this.list = [];
        //create new (empty) lots
        for (let iLot = 0; iLot < this.lotsRequired; iLot++) {
            this.list.push(new Lot(this.lotSpaces));
        }
    }

    /** Push the lot contents to the HTML */
    visualiseLots() {
        if (Lots.I.getFullLotCount() < 1) {
            return;
        }
        let lotStr = "";
        for (let iLot in this.list) {
            lotStr += this.splitLotNumber(Number(iLot)) + "\t";
            for (let space of this.list[iLot].spaces) {
                lotStr += "(" + space.id + ")\t";
            }
            lotStr += "\n";
        }
        getPreElement("lotsText").innerText = lotStr;
        getPreElement("lotsText").style.backgroundColor = "#00FF00";
    }


    refresh() {
        this.clear();
        Participants.I.populateLots();
    }

}

/*****************************************************************************
 ******************************* PARTICIPANTS ********************************
 *****************************************************************************/

class Participants {
    list: Participant[] = [];

    private constructor() { };
    static Instance = new Participants();
    static get I() { return this.Instance }

    get poolSpace() {
        let space = 0;
        for (let part of this.list) {
            space += part.poolCount;
        }
        return space;
    }
    get poolParts() {
        let parts: Participant[] = [];
        for (let part of this.list) {
            if (part.poolCount > 0) {
                parts.push(part);
            }
        }
        return parts;
    }

    idExists(id: string) {
        for (let part of this.list) {
            if (part.id == id) return true;
        }
        return false;
    }

    getId(id: string): Participant {
        for (let part of this.list) {
            if (part.id == id) return part;
        }
        return null;
    }

    getLargestPool() {
        let largestPool: Participant;
        for (let part of this.list) {
            if (largestPool === undefined)
                largestPool = part;
            if (part.poolCount > largestPool.poolCount)
                largestPool = part;
        }
        return largestPool;
    }

    populateLots() {
        /** Cannot populate anything without participants */
        if (this.list.length < 1) return;

        if (this.getLargestPool().poolCount > Lots.I.lotsRequired) {
            getPreElement("lotsText").innerText = "Meer vermeldingen in grootste poel dan aantal loten om ze over te verdelen.";
            getPreElement("lotsText").style.backgroundColor = "#FF0000";
            return;
        } else {
            getPreElement("lotsText").innerText = "Populating...";
        }
        //let's go, fill them lots up
        while (this.poolSpace > 0) {
            if (Lots.FailedAttempts > Lots.MaxFailedAttempts) {
                console.warn("WARNING: Max attempts reached." + (Lots.FailedAttempts))
                return;
            }
            this.getLargestPool().distribute();
        }
    }

    removeParticipant(id: string) {
        for (let iPart = 0; iPart < this.list.length; iPart++) {
            if (this.list[iPart].id == id)
                this.list.splice(iPart, 1);
        }
    }

    addParticipant(id: string, chance: number) {
        this.list.push(new Participant(id, chance));
        let partID = getInputElement("part_id").value = numberToBase26(this.list.length + 1);
    }

    updateList() {
        let retStr = "";
        this.list.forEach(participant => {
            let delHtml = "<span class=\"operation\" onclick=\"Main.DelUnit('" + participant.id + "')\">" +
                "&#10060;</span>";
            if (retStr.length < 1)
                retStr = "<div class=\"parttable\"><table><tr><th>id:</th><td>" + participant.id + "</td></tr><tr><th>kans:</th><td>" + participant.chance + "</td></tr><tr><th>actie:</th><td>" + delHtml + "</td></tr></table></div>";
            else retStr += "<div class=\"parttable\"><table><tr><td>" + participant.id + "</td></tr><tr><td>" + participant.chance + "</td></tr><tr><td>" + delHtml + "</td></tr></table></div>";
        });
        getDivElement("participantsList").innerHTML = retStr;;
    }

    fillPools() {
        if (this.list.length < 1)
            return;

        let totalChance = 0;
        let totalDistributed = 0;

        //first run: summarize all chances and reset poolCounts:
        for (let part of this.list) {
            totalChance += part.chance;
            part.reset();
        }
        //second run: distribute participants space pools based on their shares excluding remainders
        for (let part of this.list) {
            let portion = part.chance / totalChance;
            let share = portion * Lots.I.totalSpaceCount;
            part.poolCount = Math.floor(share);
            part.remainder = share - part.poolCount;
            totalDistributed += part.poolCount;
        }
        // distribute leftovers by highest remainders
        for (let leftOver = 0; leftOver < (Lots.I.totalSpaceCount - totalDistributed); leftOver++) {
            let remainder = this.distributeARemainder().remainder;
        }
    }

    prettyPercent(val: number, decimals = 3) {
        return (100 * val).toFixed(decimals) + "%";
    }
    prettyScalar(val: number, decimals = 3) {
        return val.toFixed(decimals);
    }

    /** make sure a value is at least 1.*/
    min1(value: number) {
        return Math.max(1, value);
    }

    visualisePools() {
        let poolText = "";
        let totalBenefit = 0;
        let maxRelBenefit = 0;
        let maxRelDeficit = 0;
        for (let part of this.list) {
            poolText += part.id + " (" + part.poolCount + " " + part.nettBenefitStr() + ")" + "\t" + ("X").repeat(part.poolCount) + " \n";
            totalBenefit += part.benefit;
            maxRelBenefit = Math.max(part.benefit / this.min1(part.poolCount - 1), maxRelBenefit);
            maxRelDeficit = Math.max(part.remainder / this.min1(part.poolCount), maxRelDeficit);
        }
        poolText = "Totaal afrondingen: " + this.prettyScalar(totalBenefit) + "\n----\n" + poolText;
        poolText = "Grootste relatieve voordeel:" + this.prettyScalar(maxRelBenefit) + "\n" + poolText;
        poolText = "Grootste relatieve nadeel:" + this.prettyScalar(maxRelDeficit) + "\n" + poolText;
        poolText = "Afrondingsmarge: " + this.prettyPercent(totalBenefit / Lots.I.totalSpaceCount) + "\n" + poolText;
        // add string to poolTextArea:
        getPreElement("partPools").innerText = poolText;
    }

    /** Distribute a single pool item to a participant pool based on remainders */
    distributeARemainder() {
        let largestPart: Participant[] = [];
        let largestRemainder = 0;
        for (let part of this.list) {
            if (part.remainder === largestRemainder) {
                largestPart.push(part);
            }
            else {
                if (part.remainder > largestRemainder) {
                    largestRemainder = part.remainder;
                    largestPart = [part];
                }
            }
        }
        if (largestPart.length < 1)
            throw Error("Error: largestPart should have values... " + (JSON.stringify(largestPart)))
        let selPart = largestPart[Math.floor(Math.random() * largestPart.length)];
        // add item to pool based on remainder
        selPart.addFromRemainder();
        return selPart;
    }

} // end class Participants




class Participant {
    constructor(id: string, chance: number) {
        this.id = id;
        this.chance = chance;
    }
    id: string;
    chance: number;

    poolCount = 0;
    remainder = 0;
    benefit = 0;

    reset() {
        this.poolCount = 0;
        this.benefit = 0;
        this.remainder = 0;

    }

    /** A readable percentage string with the benefit the participant profited from at the distribution
      * of the remainders.  */
    nettBenefitStr(formatDigits = 3) {
        return (this.benefit > 0 ? "+" : "") + (100 * (this.benefit - this.remainder)).toFixed(formatDigits) + "%";
    }

    /** Lots including this participant on it's spaces */
    lotsWith() {
        let lots: Lot[] = [];
        for (let lot of Lots.I.list) {
            if (lot.hasParticipantId(this.id)) {
                lots.push(lot);
            }
        }
        return lots;
    }

    /** Lots without this participants that are completely filled. */
    lotsWithoutFull() {
        let lots: Lot[] = [];
        for (let lot of Lots.I.list) {
            if (!lot.hasParticipantId(this.id) && !lot.hasSpaceLeft) {
                lots.push(lot);
            }
        }
        return lots;
    }

    /** Lots without this participants that have space left. */
    lotsWithoutNotFull() {
        let lots: Lot[] = [];
        for (let lot of Lots.I.list) {
            if (!lot.hasParticipantId(this.id) && lot.hasSpaceLeft) {
                lots.push(lot);
            }
        }
        return lots;
    }

    addFromRemainder() {
        this.poolCount++;
        // set benefit: 
        this.benefit = 1 - this.remainder;
        // reset remainder
        this.remainder = 0;
    }

    /** Distribute slots in the pool of this participant over the lots with free spaces. */
    distribute() {
        let freeLots = this.lotsWithoutNotFull()
        if (freeLots.length < 1) {
            Lots.FailedAttempts++;
            let redistLot = rndFromArr(this.lotsWithoutFull());
            redistLot.backToPools();
            return;
        }
        let freeLot = rndFromArr(freeLots);
        freeLot.addPart(this);
        if (this.poolCount > 0) {
            if (Lots.FailedAttempts > Lots.MaxFailedAttempts) {
                console.warn("Warning: exceeded " + Lots.MaxFailedAttempts + " attempts. That's enough. ");
                return
            };
            this.distribute();
        }
        return true;
    }

    toString() {
        return this.id + "(" + this.chance + "~" + this.poolCount + ")";
    }
} //end class Participant

class Lot {

    spaces: Participant[] = [];
    spaceCount: number;

    constructor(spaceCount: number) {
        this.spaceCount = spaceCount;
    }

    /** Add participant to free lot space and decreate poolcount for participant. */
    addPart(part: Participant) {
        this.spaces.push(part);
        part.poolCount--;
    }

    spaceDefined(spaceIndex: number) {
        // index is larger than array length.
        if (spaceIndex + 1 > this.spaces.length)
            return false;
        return (this.spaces[spaceIndex] != null)
    }

    /** Remove participants from the spaces on the lot, back to the pools of the participants. */
    backToPools() {
        while (this.spaces.length > 0) {
            let part = this.spaces.pop();
            part.poolCount++;
        }
    }
    hasParticipant(part: Participant) {
        return this.hasParticipantId(part.id);
    }
    hasParticipantId(partId: string) {
        for (let iPart of this.spaces) {
            if (iPart !== null && iPart.id == partId)
                return true;
        }
        return false;
    }
    get hasSpaceLeft(): boolean {
        return this.spaces.length < this.spaceCount;
    }

    toString() {
        return this.spaces.join("^");
    }
} // End class Lot
