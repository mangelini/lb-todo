import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Todo, TodoRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class TodoRepository extends DefaultCrudRepository<
  Todo,
  typeof Todo.prototype.id,
  TodoRelations
> {
  public readonly user: BelongsToAccessor<User, typeof Todo.prototype.id>;
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Todo, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
  }
}
