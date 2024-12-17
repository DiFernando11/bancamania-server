import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Usuario } from './users.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>
  ) {}
  async findByEmail(email: string): Promise<Usuario | undefined> {
    return this.usuarioRepository.findOne({
      where: { email },
    })
  }

  async findByAttribute(
    attribute: keyof Usuario,
    value: any
  ): Promise<Usuario | undefined> {
    return this.usuarioRepository.findOne({
      where: { [attribute]: value },
    })
  }

  async createUser(user: Partial<Usuario>) {
    const newUser = this.usuarioRepository.create({
      authMethods: user.authMethods,
      email: user.email,
      first_name: user.first_name,
      image: user.image,
      last_name: user.last_name,
      password: user.password,
      phone_number: user.phone_number,
    })

    return await this.usuarioRepository.save(newUser)
  }

  async updateUser(
    attribute: keyof Usuario,
    value: any,
    user: Partial<Usuario>
  ) {
    this.usuarioRepository.update({ [attribute]: value }, user)
  }

  async createOrUpdateUser({
    findAttribute,
    findValue,
    userData,
    existingUser,
  }: {
    findAttribute: keyof Usuario
    findValue: any
    userData: Partial<Usuario>
    existingUser?: Usuario | undefined
  }): Promise<Usuario> {
    let existingUserData = existingUser
    if (!existingUser) {
      existingUserData = await this.findByAttribute(findAttribute, findValue)
    }

    if (existingUserData) {
      await this.updateUser(findAttribute, findValue, userData)
      const userUpdate = {
        ...existingUser,
        ...userData,
      }

      return userUpdate
    }

    return this.createUser(userData)
  }
}
