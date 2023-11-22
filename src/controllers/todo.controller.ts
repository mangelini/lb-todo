import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {Todo} from '../models';
import {TodoRepository, UserRepository} from '../repositories';

@authenticate('jwt')
export class TodoController {
  constructor(
    @repository(TodoRepository)
    public todoRepository: TodoRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  @post('/todos')
  @response(200, {
    description: 'Todo model instance',
    content: {'application/json': {schema: getModelSchemaRef(Todo)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {
            title: 'NewTodo',
            exclude: ['id', 'isCompleted'],
          }),
        },
      },
    })
    todo: Omit<Todo, 'id' | 'isCompleted'>,
  ): Promise<Todo> {
    return this.todoRepository.create(todo);
  }

  @get('/todos/count')
  @response(200, {
    description: 'Todo model count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authorize({allowedRoles: ['admin']})
  async count(): Promise<Count> {
    return this.todoRepository.count();
  }

  @get('/todos')
  @response(200, {
    description: 'Array of Todo model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Todo, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @param.filter(Todo) filter?: Filter<Todo>,
  ): Promise<Todo[]> {
    const currentUser = await this.userRepository.findOne({
      where: {
        username: currentUserProfile.name,
      },
      fields: {
        password: false,
      },
    });

    if (!currentUser) {
      throw new Error('Current user not found');
    }

    if (currentUser.role.includes('admin')) {
      return this.todoRepository.find(filter);
    }

    // If the user is not an admin, return only their todos
    const userFilter: Filter<Todo> = {
      ...filter,
      where: {
        ...filter?.where,
        userId: currentUser.id,
      },
    };
    return this.todoRepository.find(userFilter);
  }

  @patch('/todos')
  @response(200, {
    description: 'Todo PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  @authorize({
    allowedRoles: ['admin'],
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {partial: true}),
        },
      },
    })
    todo: Todo,
    @param.where(Todo) where?: Where<Todo>,
  ): Promise<Count> {
    return this.todoRepository.updateAll(todo, where);
  }

  @get('/todos/{id}')
  @response(200, {
    description: 'Todo model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Todo, {includeRelations: true}),
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.filter(Todo, {exclude: 'where'}) filter?: FilterExcludingWhere<Todo>,
  ): Promise<Todo | {statusCode: number; message: string}> {
    const todoCreator = this.todoRepository.user;
    if (todoCreator.name !== currentUserProfile.name) {
      return {
        statusCode: 403,
        message: 'The authenticated user is not the creator of this todo',
      };
    }
    return this.todoRepository.findById(id, filter);
  }

  @patch('/todos/{id}')
  @response(204, {
    description: 'Todo PATCH success',
  })
  async updateById(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Todo, {partial: true}),
        },
      },
    })
    todo: Todo,
  ): Promise<{statusCode: number; message: string}> {
    const todoCreator = this.todoRepository.user;
    if (todoCreator.name !== currentUserProfile.name) {
      return {
        statusCode: 403,
        message: 'The authenticated user is not the creator of this todo',
      };
    }

    await this.todoRepository.updateById(id, todo);

    return {
      statusCode: 200,
      message: 'Todo successfully updated',
    };
  }
}
