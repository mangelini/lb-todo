import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Todo, User, UserRelations} from '../models';
import {TodoRepository} from './todo.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly todos: HasManyRepositoryFactory<
    Todo,
    typeof User.prototype.id
  >;
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('TodoRepository')
    protected todoRepositoryGetter: Getter<TodoRepository>,
  ) {
    super(User, dataSource);
    this.todos = this.createHasManyRepositoryFactoryFor(
      'todos',
      todoRepositoryGetter,
    );
  }
}
