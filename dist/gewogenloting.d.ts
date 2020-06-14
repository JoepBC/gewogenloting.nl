/** Function numberToBase26 by CodeKonami: https://stackoverflow.com/questions/45787459/convert-number-to-alphabet-string-javascript/45787487 */
declare function numberToBase26(integerValue: number, tail?: string): string;
/**** HTML accessors *****/
declare function getInputElement(id: string): HTMLInputElement;
declare function getDivElement(id: string): HTMLDivElement;
/**** HTML accessors *****/
declare function rndFromArr<T>(anArray: T[]): T;
declare class Main {
    static Init(): void;
    static DelUnit(id: string): void;
    static I: Main;
    /** The users to divide the spaces on the lots over */
    participants: Participants;
    /** The lots to be printed/published in advance and
      * to select on from manually afterwards,
      * by rolling dice / bingo / etc. */
    lots: Lots;
    constructor();
    /** Attach some functionality to the buttons in the HTML */
    assignInput(): void;
    addChance(): void;
    refresh(): void;
    updateInputFields(): void;
}
/*****************************************************************************
 ********************************* LOTS **************************************
 *****************************************************************************/
declare class Lots {
    list: Lot[];
    private constructor();
    static Instance: Lots;
    static get I(): Lots;
    static FailedAttempts: number;
    static MaxFailedAttempts: number;
    lotsBase: number;
    get lotsRequired(): number;
    lotSpaces: number;
    lotsMultiplier: number;
    /** count al lots and spaces (regardless the spaces being filled) */
    get totalSpaceCount(): number;
    /** When 'exponent' value is > 1, we want to split the lot numbers/identifiers up,
     *  to allow for several draws to produce a combined lot id. */
    static splitLotNumber(val: number, base: number, splitCount: number): string;
    splitLotNumber(val: number): string;
    /** How many lots exist that have no space left? */
    getFullLotCount(excludeId?: string): number;
    /** Cleanup the list before creating a new one. */
    clear(): void;
    /** Push the lot contents to the HTML */
    visualiseLots(): void;
    refresh(): void;
}
/*****************************************************************************
 ******************************* PARTICIPANTS ********************************
 *****************************************************************************/
declare class Participants {
    list: Participant[];
    private constructor();
    static Instance: Participants;
    static get I(): Participants;
    get poolSpace(): number;
    get poolParts(): Participant[];
    idExists(id: string): boolean;
    getId(id: string): Participant;
    getLargestPool(): Participant;
    populateLots(): void;
    removeParticipant(id: string): void;
    addParticipant(id: string, chance: number): void;
    updateList(): void;
    fillPools(): void;
    prettyPercent(val: number, decimals?: number): string;
    prettyScalar(val: number, decimals?: number): string;
    /** make sure a value is at least 1.*/
    min1(value: number): number;
    visualisePools(): void;
    /** Distribute a single pool item to a participant pool based on remainders */
    distributeARemainder(): Participant;
}
declare class Participant {
    constructor(id: string, chance: number);
    id: string;
    chance: number;
    poolCount: number;
    remainder: number;
    benefit: number;
    reset(): void;
    /** A readable percentage string with the benefit the participant profited from at the distribution
      * of the remainders.  */
    nettBenefitStr(formatDigits?: number): string;
    /** Lots including this participant on it's spaces */
    lotsWith(): Lot[];
    /** Lots without this participants that are completely filled. */
    lotsWithoutFull(): Lot[];
    /** Lots without this participants that have space left. */
    lotsWithoutNotFull(): Lot[];
    addFromRemainder(): void;
    /** Distribute slots in the pool of this participant over the lots with free spaces. */
    distribute(): boolean;
    toString(): string;
}
declare class Lot {
    spaces: Participant[];
    spaceCount: number;
    constructor(spaceCount: number);
    /** Add participant to free lot space and decreate poolcount for participant. */
    addPart(part: Participant): void;
    spaceDefined(spaceIndex: number): boolean;
    /** Remove participants from the spaces on the lot, back to the pools of the participants. */
    backToPools(): void;
    hasParticipant(part: Participant): boolean;
    hasParticipantId(partId: string): boolean;
    get hasSpaceLeft(): boolean;
    toString(): string;
}
