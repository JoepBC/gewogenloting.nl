"use strict";
window.addEventListener('DOMContentLoaded', function () { Main.Init(); });
/** Function numberToBase26 by CodeKonami: https://stackoverflow.com/questions/45787459/convert-number-to-alphabet-string-javascript/45787487 */
function numberToBase26(integerValue, tail) {
    if (tail === void 0) { tail = ''; }
    if (integerValue <= 26) {
        return "" + String.fromCharCode(integerValue + 64) + tail;
    }
    var remainder = integerValue % 26 || 26;
    var division = Math.floor(integerValue / 26) - (remainder === 26 ? 1 : 0);
    return numberToBase26(division, "" + String.fromCharCode(remainder + 64) + tail);
}
/**** HTML accessors *****/
function getInputElement(id) { return document.getElementById(id); }
function getDivElement(id) { return document.getElementById(id); }
/**** HTML accessors *****/
function rndFromArr(anArray) {
    return anArray[Math.floor(Math.random() * anArray.length)];
}
var Main = /** @class */ (function () {
    function Main() {
        this.assignInput();
        this.participants = Participants.I;
        this.lots = Lots.I;
        Main.I = this;
    }
    Main.Init = function () {
        console.log("GewogenLoting.nl by Joep Bos-Coenraad (/dev/nl)");
        console.log("TypeScript source available at github.com/joepbc");
        new Main();
    };
    Main.DelUnit = function (id) {
        console.log("Deleting " + id);
        this.I.participants.removeParticipant(id);
        this.I.refresh();
    };
    Main.prototype.verbose = function () {
        var c = 6;
        var multiplier = 2;
        var retHTML = "";
        for (var x = 1; x <= Math.pow(c, multiplier); x++) {
            var ix = x - 1;
            retHTML += Lots.spitLotNumber(ix, c, multiplier) + "\n";
        }
        getInputElement('verbose').innerHTML = retHTML;
    };
    Main.prototype.assignInput = function () {
        var _this = this;
        getInputElement('add_participant').onclick = function () { _this.addChance(); };
        getInputElement('lots_refresh').onclick = function () { _this.refresh(); };
    };
    Main.prototype.addChance = function () {
        /* Read input form values */
        var partID = getInputElement("part_id").value;
        var partChance = getInputElement("part_chance").value;
        /* Add new participant to the participants list HTML */
        if (this.participants.idExists(partID)) {
            alert("Kies een nieuw ID. Naam/id '" + partID + "' bestaat al.");
        }
        else
            this.participants.addParticipant(partID, Number(partChance));
        this.refresh();
    };
    Main.prototype.refresh = function () {
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
    };
    Main.prototype.updateInputFields = function () {
        Lots.I.lotsBase = Number(getInputElement("lotCount").value);
        Lots.I.lotSpaces = Number(getInputElement("lotSpaces").value);
        Lots.I.lotsMultiplier = Number(getInputElement("lotMultiplier").value);
    };
    return Main;
}());
/*****************************************************************************
 ********************************* LOTS **************************************
 *****************************************************************************/
var Lots = /** @class */ (function () {
    function Lots() {
        this.list = [];
        this.lotsBase = 10;
        this.lotSpaces = 5;
        this.lotsMultiplier = 1;
    }
    ;
    Object.defineProperty(Lots, "I", {
        get: function () { return this.Instance; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Lots.prototype, "lotsRequired", {
        get: function () { return Math.pow(this.lotsBase, this.lotsMultiplier); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Lots.prototype, "totalSpaceCount", {
        /** count al lots and spaces (regardless the spaces being filled) */
        get: function () {
            // if Lots haven't been created yet:
            if (this.list.length == 0)
                return this.lotSpaces * this.lotsRequired;
            // when lots have been created, use their actual sizes:
            var totalSpaces = 0;
            this.list.forEach(function (lot) {
                totalSpaces += lot.spaceCount;
            });
            return totalSpaces;
        },
        enumerable: true,
        configurable: true
    });
    Lots.spitLotNumber = function (val, base, splitCount) {
        var tArr = [];
        for (var i = splitCount; i >= 1; i--) {
            var jx = Math.floor(val / (Math.pow(base, i - 1)));
            val = val - (jx * (Math.pow(base, i - 1)));
            tArr.push(jx + 1);
        }
        return tArr.join('-');
    };
    Lots.prototype.splitLotNumber = function (val) {
        return Lots.spitLotNumber(val, this.lotsBase, this.lotsMultiplier);
    };
    Lots.prototype.getFullLotCount = function (excludeId) {
        var retVal = 0;
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var aLot = _a[_i];
            if (!aLot.hasSpaceLeft)
                retVal++;
        }
        return retVal;
    };
    Lots.prototype.getFilledLotNr = function (num, mustHaveId) {
        var count = 0;
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var lot = _a[_i];
            if (!lot.hasSpaceLeft && ((mustHaveId == undefined) || (lot.hasParticipantId(mustHaveId)))) {
                if (count == num)
                    return lot;
                count++;
            }
        }
        ;
        throw ("Looking for filled lot that doesn't exist? - " + num + " / " + count);
    };
    Lots.prototype.clear = function () {
        //cleanup list
        this.list = [];
        //make new (empty) lots
        for (var iLot = 0; iLot < this.lotsRequired; iLot++) {
            this.list.push(new Lot(this.lotSpaces));
        }
    };
    Lots.prototype.visualiseLots = function () {
        if (Lots.I.getFullLotCount() < 1) {
            return;
        }
        var lotStr = "";
        for (var iLot in this.list) {
            lotStr += this.splitLotNumber(Number(iLot)) + "\t";
            for (var _i = 0, _a = this.list[iLot].spaces; _i < _a.length; _i++) {
                var space = _a[_i];
                lotStr += "(" + space.id + ")\t";
            }
            lotStr += "\n";
        }
        getInputElement("lotsText").value = lotStr;
        getInputElement("lotsText").style.backgroundColor = "#00FF00";
    };
    Lots.prototype.refresh = function () {
        console.log("Refreshing list");
        this.clear();
        Participants.I.populateLots();
    };
    Lots.Instance = new Lots();
    Lots.FailedAttempts = 0;
    Lots.MaxFailedAttempts = 1000;
    return Lots;
}());
/*****************************************************************************
 ******************************* PARTICIPANTS ********************************
 *****************************************************************************/
var Participants = /** @class */ (function () {
    function Participants() {
        this.list = [];
    }
    ;
    Object.defineProperty(Participants, "I", {
        get: function () { return this.Instance; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Participants.prototype, "poolSpace", {
        get: function () {
            var space = 0;
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var part = _a[_i];
                space += part.poolCount;
            }
            return space;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Participants.prototype, "poolParts", {
        get: function () {
            var parts = [];
            for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                var part = _a[_i];
                if (part.poolCount > 0) {
                    parts.push(part);
                }
            }
            return parts;
        },
        enumerable: true,
        configurable: true
    });
    Participants.prototype.idExists = function (id) {
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
            if (part.id == id)
                return true;
        }
        return false;
    };
    Participants.prototype.getId = function (id) {
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
            if (part.id == id)
                return part;
        }
        return null;
    };
    Participants.prototype.getLargestPool = function () {
        var largestPool;
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
            if (largestPool === undefined)
                largestPool = part;
            if (part.poolCount > largestPool.poolCount)
                largestPool = part;
        }
        return largestPool;
    };
    Participants.prototype.populateLots = function () {
        /** Cannot populate anything without participants */
        if (this.list.length < 1)
            return;
        if (this.getLargestPool().poolCount > Lots.I.lotsRequired) {
            getInputElement("lotsText").value = "Meer vermeldingen in grootste poel dan aantal loten om ze over te verdelen.";
            getInputElement("lotsText").style.backgroundColor = "#FF0000";
            return;
        }
        else {
            getInputElement("lotsText").value = "Populating...";
        }
        //let's go, fill them lots up
        while (this.poolSpace > 0) {
            if (Lots.FailedAttempts > Lots.MaxFailedAttempts) {
                console.log("Max attempts reached." + (Lots.FailedAttempts));
                return;
            }
            this.getLargestPool().distribute();
        }
    };
    Participants.prototype.removeParticipant = function (id) {
        for (var iPart = 0; iPart < this.list.length; iPart++) {
            if (this.list[iPart].id == id)
                this.list.splice(iPart, 1);
        }
    };
    Participants.prototype.getRandomPoolPart = function () {
        var poolSpace = this.poolSpace;
        var poolNr = Math.ceil(Math.random() * poolSpace);
        var remainPool = poolNr;
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
            if (part.poolCount <= remainPool)
                return part;
            remainPool -= part.poolCount;
        }
        throw ("poolNr (" + poolNr + ") not found in poolspace (" + poolSpace + ") [remaining: " + remainPool + "]");
    };
    Participants.prototype.addParticipant = function (id, chance) {
        this.list.push(new Participant(id, chance));
        var partID = getInputElement("part_id").value = numberToBase26(this.list.length + 1);
    };
    Participants.prototype.updateList = function () {
        var retStr = "";
        this.list.forEach(function (participant) {
            var delHtml = "<span class=\"operation\" onclick=\"Main.DelUnit('" + participant.id + "')\">" +
                "&#10060;</span>";
            if (retStr.length < 1)
                retStr = "<div class=\"parttable\"><table><tr><th>id:</th><td>" + participant.id + "</td></tr><tr><th>kans:</th><td>" + participant.chance + "</td></tr><tr><th>actie:</th><td>" + delHtml + "</td></tr></table></div>";
            else
                retStr += "<div class=\"parttable\"><table><tr><td>" + participant.id + "</td></tr><tr><td>" + participant.chance + "</td></tr><tr><td>" + delHtml + "</td></tr></table></div>";
        });
        getDivElement("participantsList").innerHTML = retStr;
        ;
    };
    Participants.prototype.fillPools = function () {
        if (this.list.length < 1)
            return;
        var totalChance = 0;
        var totalDistributed = 0;
        //first run: summarize all chances and reset poolCounts:
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
            totalChance += part.chance;
            part.reset();
        }
        //second run: distribute participants space pools based on their shares excluding remainders
        for (var _b = 0, _c = this.list; _b < _c.length; _b++) {
            var part = _c[_b];
            var portion = part.chance / totalChance;
            var share = portion * Lots.I.totalSpaceCount;
            part.poolCount = Math.floor(share);
            part.remainder = share - part.poolCount;
            totalDistributed += part.poolCount;
        }
        // distribute leftovers by highest remainders
        for (var leftOver = 0; leftOver < (Lots.I.totalSpaceCount - totalDistributed); leftOver++) {
            var remainder = this.addRemainder().remainder;
        }
    };
    Participants.prototype.prettyPercent = function (val, decimals) {
        if (decimals === void 0) { decimals = 3; }
        return (100 * val).toFixed(decimals) + "%";
    };
    Participants.prototype.min1 = function (value) {
        return Math.max(1, value);
    };
    Participants.prototype.visualisePools = function () {
        var poolText = "";
        var totalBenefit = 0;
        var maxRelBenefit = 0;
        var maxRelDeficit = 0;
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
            poolText += part.id + " (" + part.poolCount + " " + part.nettBenefitStr() + ")" + "\t" + ("X").repeat(part.poolCount) + " \n";
            totalBenefit += part.benefit;
            maxRelBenefit = Math.max(part.benefit / this.min1(part.poolCount - 1), maxRelBenefit);
            maxRelDeficit = Math.max(part.remainder / this.min1(part.poolCount), maxRelDeficit);
            //console.log(maxRelDeficit + " - " + part.poolCount + " " + this.min1(part.poolCount) + " rem:" + part.remainder);
        }
        poolText = "Totaal afrondingen: " + (totalBenefit).toFixed(3) + "\n----\n" + poolText;
        poolText = "Grootste relatieve voordeel:" + this.prettyPercent(maxRelBenefit) + "\n" + poolText;
        poolText = "Grootste relatieve nadeel:" + this.prettyPercent(maxRelDeficit) + "\n" + poolText;
        poolText = "Afrondingsmarge: " + this.prettyPercent(totalBenefit / Lots.I.totalSpaceCount) + "\n" + poolText;
        // add string to poolTextArea:
        getInputElement("partPools").value = poolText;
    };
    Participants.prototype.addRemainder = function () {
        var largestPart = [];
        var largestRemainder = 0;
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var part = _a[_i];
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
            throw Error("Error: largestPart should have values... " + (JSON.stringify(largestPart)));
        var selPart = largestPart[Math.floor(Math.random() * largestPart.length)];
        // add item to pool based on remainder
        selPart.addFromRemainder();
        return selPart;
    };
    Participants.Instance = new Participants();
    return Participants;
}());
var Participant = /** @class */ (function () {
    function Participant(id, chance) {
        this.poolCount = 0;
        this.remainder = 0;
        this.benefit = 0;
        this.id = id;
        this.chance = chance;
    }
    Participant.prototype.reset = function () {
        this.poolCount = 0;
        this.benefit = 0;
        this.remainder = 0;
    };
    /** A readable percentage string with the benefit the participant profited from at the distribution
      * of the remainders.  */
    Participant.prototype.nettBenefitStr = function (formatDigits) {
        if (formatDigits === void 0) { formatDigits = 3; }
        return (this.benefit > 0 ? "+" : "") + (100 * (this.benefit - this.remainder)).toFixed(formatDigits) + "%";
    };
    /** Lots including this participant on it's spaces */
    Participant.prototype.lotsWith = function () {
        var lots = [];
        for (var _i = 0, _a = Lots.I.list; _i < _a.length; _i++) {
            var lot = _a[_i];
            if (lot.hasParticipantId(this.id)) {
                lots.push(lot);
            }
        }
        return lots;
    };
    /** Lots without this participants that are completely filled. */
    Participant.prototype.lotsWithoutFull = function () {
        var lots = [];
        for (var _i = 0, _a = Lots.I.list; _i < _a.length; _i++) {
            var lot = _a[_i];
            if (!lot.hasParticipantId(this.id) && !lot.hasSpaceLeft) {
                lots.push(lot);
            }
        }
        return lots;
    };
    /** Lots without this participants that have space left. */
    Participant.prototype.lotsWithoutNotFull = function () {
        var lots = [];
        for (var _i = 0, _a = Lots.I.list; _i < _a.length; _i++) {
            var lot = _a[_i];
            if (!lot.hasParticipantId(this.id) && lot.hasSpaceLeft) {
                lots.push(lot);
            }
        }
        return lots;
    };
    Participant.prototype.addFromRemainder = function () {
        this.poolCount++;
        // set benefit: 
        this.benefit = 1 - this.remainder;
        // reset remainder
        this.remainder = 0;
    };
    Participant.prototype.toString = function () {
        return this.id + "(" + this.chance + "~" + this.poolCount + ")";
    };
    Participant.prototype.distribute = function () {
        var freeLots = this.lotsWithoutNotFull();
        if (freeLots.length < 1) {
            Lots.FailedAttempts++;
            var redistLot = rndFromArr(this.lotsWithoutFull());
            redistLot.backToPools();
            return;
        }
        var freeLot = rndFromArr(freeLots);
        freeLot.addPart(this);
        if (this.poolCount > 0) {
            if (Lots.FailedAttempts > Lots.MaxFailedAttempts) {
                console.log("Exceeded " + Lots.MaxFailedAttempts + " attempts. That's enough. ");
                return;
            }
            ;
            this.distribute();
        }
        return true;
    };
    return Participant;
}());
var Lot = /** @class */ (function () {
    function Lot(spaceCount) {
        this.spaces = [];
        this.spaceCount = spaceCount;
    }
    /** Add participant to free lot space and decreate poolcount for participant. */
    Lot.prototype.addPart = function (part) {
        this.spaces.push(part);
        part.poolCount--;
    };
    Lot.prototype.spaceDefined = function (spaceIndex) {
        // index is larger than array length.
        if (spaceIndex + 1 > this.spaces.length)
            return false;
        return (this.spaces[spaceIndex] != null);
    };
    /** Remove participants from the spaces on the lot, back to the pools of the participants. */
    Lot.prototype.backToPools = function () {
        while (this.spaces.length > 0) {
            var part = this.spaces.pop();
            part.poolCount++;
        }
    };
    Lot.prototype.hasParticipant = function (part) {
        return this.hasParticipantId(part.id);
    };
    Lot.prototype.hasParticipantId = function (partId) {
        for (var _i = 0, _a = this.spaces; _i < _a.length; _i++) {
            var iPart = _a[_i];
            if (iPart !== null && iPart.id == partId)
                return true;
        }
        return false;
    };
    Object.defineProperty(Lot.prototype, "hasSpaceLeft", {
        get: function () {
            return this.spaces.length < this.spaceCount;
        },
        enumerable: true,
        configurable: true
    });
    Lot.prototype.toString = function () {
        return this.spaces.join("^");
    };
    return Lot;
}());
//# sourceMappingURL=gewogenloting.js.map