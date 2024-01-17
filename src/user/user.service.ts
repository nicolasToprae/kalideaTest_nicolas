import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { IAddUser, IUser, UserId } from './user.interfaces';
import { UserEmail } from '../email/email.types';
import { EmailId, IAddEmail } from '../email/email.interfaces';
import { EmailEntity } from '../email/email.entity';
import { USER } from 'src/assets/enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {}

  /**
   * Ajoute un utilisateur
   * @param user Utilisateur à ajouter au système
   */
  async add(user: IAddUser) {
    const addedUser = await this.userRepository.insert({
      ...user,
      status: USER.STATUS_ENABLE,
    });
    const userId = addedUser.identifiers[0].id;

    return userId;
  }

  /**
   * Suppression d'un utilisateur (soft delete)
   *
   * @param userId Identifiant de l'utilisateur à désactiver
   * @returns L'identifiant de l'utilisateur désactivé
   */
  async deactivate(userId: UserId) {
    const userExists = await this.userRepository.exist({
      where: { id: Equal(userId) },
    });
    if (!userExists) {
      throw new NotFoundException(`L'utilisateur n'a pas été trouvé`);
    }

    await this.userRepository.update(
      { id: Equal(userId) },
      { status: USER.STATUS_DISABLE },
    );

    return userId;
  }

  /**
   * Récupère un utilisateur par rapport à un identifiant
   * @param id Identifiant de l'utilisateur à récupérer
   * @returns L'utilisateur correspondant à l'identifiant ou undefined
   */
  get(id: UserId): Promise<IUser> {
    return this.userRepository.findOneBy({ id: Equal(id) });
  }

  /**
   * Récupère un utilisateur par rapport à son mail
   * @param userEmail Email de l'utilisateur à récupérer
   * @returns L'utilisateur correspondant à l'identifiant ou undefined
   */
  getByEmail(userEmail: UserEmail): Promise<IUser> {
    return this.userRepository.findOne({
      where: {
        emails: {
          address: userEmail.address,
        },
      },
      relations: ['emails'],
    });
  }

  /**
   * Ajoute un email à un utilisateur
   * @param email Email à ajouter a l'utilisateur
   * @param userId Identifiant de l'utilisateur
   */
  async addEmail(email: IAddEmail, userId: UserId) {
    const userExists = await this.userRepository.exist({
      where: { id: Equal(userId), status: Equal(USER.STATUS_ENABLE) },
    });
    if (!userExists) {
      throw new NotFoundException(
        `L'utilisateur n'a pas été trouvé ou à été desactivé`,
      );
    }

    const emailExists = await this.emailRepository.exist({
      where: { address: Equal(email.address), userId: Equal(userId) },
    });
    if (emailExists) {
      throw new PreconditionFailedException(
        `L'email existe déjà pour cet utilisateur`,
      );
    }

    const addedEmail = await this.emailRepository.insert({
      ...email,
      userId: userId,
    });

    const emailId = addedEmail.identifiers[0].id;

    return emailId;
  }

  /**
   * Modifie un email d'un utilisateur
   * @param emailId Identifiant du mail à modifier
   * @param newMail Nouvelle valeur de l'adresse mail
   * @param userId Identifiant de l'utilisateur
   */
  async updateEmail(newMail: IAddEmail, emailId: EmailId, userId: UserId) {
    const userExists = await this.userRepository.exist({
      where: { id: Equal(userId), status: Equal(USER.STATUS_ENABLE) },
    });
    if (!userExists) {
      throw new NotFoundException(
        `L'utilisateur n'a pas été trouvé ou à été desactivé`,
      );
    }
    const emailExists = await this.emailRepository.exist({
      where: { id: Equal(emailId) },
    });
    if (!emailExists) {
      throw new NotFoundException(`L'email n'existe pas`);
    }

    const emailAddressExists = await this.emailRepository.exist({
      where: { address: Equal(newMail.address), userId: Equal(userId) },
    });
    if (emailAddressExists) {
      throw new PreconditionFailedException(
        `L'email existe déjà pour cet utilisateur`,
      );
    }

    await this.emailRepository.update(
      { id: Equal(emailId) },
      { address: newMail.address },
    );

    return emailId;
  }
}
