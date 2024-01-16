import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, In, Repository } from 'typeorm';
import { UserId } from '../user/user.interfaces';
import { EmailEntity } from './email.entity';
import { IEmail } from './email.interfaces';
import { EmailFiltersArgs } from './email.types';
import { User } from '../user/user.types';

@Injectable()
export class EmailService {
  constructor(
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {}

  /**
   * Récupère une adresse email par rapport à son identifiant
   * @param id Identifiant de l'utilisateur à récupérer
   * @returns L'email correspondant à l'identifiant ou undefined
   */
  getEmail(id: UserId): Promise<IEmail> {
    return this.emailRepository.findOneBy({ id: Equal(id) });
  }

  /**
   * Récupère une liste d'email en fonction de filtres
   * @param filters Filtres d'email
   * @param user En fonction d'un utilisateur <optionnel>
   * @returns Liste d'emails en fonction des filtres
   */
  getEmails(filters: EmailFiltersArgs, user?: User | {}) {
    const where: FindOptionsWhere<EmailEntity> = {};
    if (user && Object.keys(user).length > 0) {
      where.userId = Equal((user as User).id);
    }

    if (filters.address) {
      const { equal, in: addressIn } = filters.address;

      if (equal) {
        if (addressIn?.length > 0) {
          addressIn.push(equal);
        }
        where.address = In(addressIn || [equal]);
      } else if (addressIn?.length > 0) {
        where.address = In(addressIn);
      }
    }

    return this.emailRepository.find({
      where,
      order: { address: 'asc' },
    });
  }
}
