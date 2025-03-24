import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/src/guards/jwt-auth.guard'
import { CreateItemStoreDto } from '@/src/modules/store/dto/createItemStore.dto'
import { GetItemsStoreDto } from '@/src/modules/store/dto/getItemsStore.dto'
import { PurchaseItemsStoreDto } from '@/src/modules/store/dto/purchaseItemStore.dto'
import { StoreService } from '@/src/modules/store/store.service'

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('/')
  @UseGuards(JwtAuthGuard)
  async createItemStore(@Body() dto: CreateItemStoreDto) {
    return this.storeService.createItemStore(dto)
  }

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getDataAccounts(@Query() query: GetItemsStoreDto) {
    return this.storeService.getItemsStore(query.page, query.limit)
  }

  @Post('/purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseItemsStore(
    @Req() req: Request,
    @Body() purchaseDto: PurchaseItemsStoreDto
  ) {
    return this.storeService.purchaseItemsStore(req, purchaseDto)
  }
}
