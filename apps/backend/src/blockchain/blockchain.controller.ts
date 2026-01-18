import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { getEventsDto } from './dto/get-events.dto';


@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}
  
  @Get("value")
  async getValue() {
    return this.blockchainService.getLatestValue();
  }

  // GET /blockchain/events
  @Post("events")
  async getEvents(@Body() body: getEventsDto) {
    return this.blockchainService.getValueUpdatedEvents(body.fromBlock, body.toblock);
  }
}