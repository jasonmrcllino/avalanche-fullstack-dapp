import { ApiProperty } from "@nestjs/swagger";

export class getEventsDto {
    @ApiProperty({
        description: "Starting block number", 
        example: 1000000
    })
    fromBlock: number;

    @ApiProperty({
        description: "Ending block number", 
        example: 1000100
    })
    toblock: number;
}