import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddEmail, EmailFiltersArgs, EmailIdArgs, UserEmail } from '../email/email.types';
import { EmailEntity } from '../email/email.entity';
import { UserId } from './user.interfaces';
import { UserService } from './user.service';
import { AddUser, User, UserIdArgs } from './user.types';
import { EmailService } from '../email/email.service';
import { EmailId } from '../email/email.interfaces';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly _service: UserService,
    private readonly _emailService: EmailService,
    @InjectRepository(EmailEntity)
    private readonly emailRepository: Repository<EmailEntity>,
  ) {}

  @Query(() => User, { name: 'user', nullable: true })
  getUser(@Args() { userId }: UserIdArgs): Promise<User> {
    return this._service.get(userId);
  }

  @Mutation(() => ID)
  addUser(@Args() user: AddUser): Promise<UserId> {
    return this._service.add(user);
  }

  @Mutation(() => ID)
  deactivateUser(@Args() { userId }: UserIdArgs): Promise<UserId> {
    return this._service.deactivate(userId);
  }

  @ResolveField(() => [UserEmail], { name: 'emails' })
  async getEmails(
    @Parent() user: User,
    @Args() filters: EmailFiltersArgs,
  ): Promise<UserEmail[]> {
    return this._emailService.getEmails(filters, user);
  }

  @Mutation(() => ID)
  addEmail(
    @Args('email') email: AddEmail,
    @Args() { userId }: UserIdArgs,
  ): Promise<EmailId> {
    return this._service.addEmail(email, userId);
  }

  @Mutation(() => ID)
  updateEmail(
    @Args('email') email: AddEmail,
    @Args() { emailId }: EmailIdArgs,
    @Args() { userId }: UserIdArgs,
  ): Promise<EmailId> {
    return this._service.updateEmail(email, emailId, userId);
  }
}
