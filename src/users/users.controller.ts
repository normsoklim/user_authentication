import { Controller ,Body, Post,Get ,Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Roles('admin')
    @Get()
    async findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

   /*  @Get(':id')
    async findOne(@Param('id') id: string): Promise<User> {
        return this.usersService.findById(id);
    } */
}
