export class Room {
    id: number = -1;

    name: string = '';
    author?: string = '';
    imagePath?: string = '';
    favourited?: boolean = false;

    constructor(n:string = '', i: number = -1) {
        this.name = n;
        this.id = i;
    }
}