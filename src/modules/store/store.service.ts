import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { I18nService } from 'nestjs-i18n'
import { Repository } from 'typeorm'
import { HttpResponseStatus } from '@/src/common/constants'
import { createPaginationData, HttpResponseSuccess } from '@/src/common/utils'
import { CreateItemStoreDto } from '@/src/modules/store/dto/createItemStore.dto'
import { Store } from '@/src/modules/store/store.entity'

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly i18n: I18nService
  ) {}

  async createItemStore(dto: CreateItemStoreDto) {
    const newStore = this.storeRepository.create(dto)
    const store = await this.storeRepository.save(newStore)
    return HttpResponseSuccess(
      this.i18n.t('store.CREATE_SUCCESS'),
      store,
      HttpResponseStatus.CREATED
    )
  }

  async getItemsStore(page, limit) {
    const { skip, take, createResponse } = createPaginationData({
      limit,
      page,
    })

    const [store, total] = await this.storeRepository.findAndCount({
      skip,
      take,
    })
    const storeFormat = store.map((data) => ({
      ...data,
      description: this.i18n.t(`store.${data.description}`),
      title: this.i18n.t(`store.${data.title}`),
    }))

    return HttpResponseSuccess(this.i18n.t('general.GET_SUCCESS'), {
      ...createResponse(total),
      store: storeFormat,
    })
  }
}
