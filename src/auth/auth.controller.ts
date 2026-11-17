import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Publico } from './publico.decorator';
import { UsuarioActual } from './usuario-actual.decorator';
import type { Usuario } from './entities/usuario.entity';
import { LoginDto, RefreshDto, RegistroDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Publico()
  @Post('registro')
  registrar(@Body() datos: RegistroDto, @UsuarioActual() actual?: Usuario) {
    return this.authService.registrar(datos, actual);
  }

  @Publico()
  @HttpCode(200)
  @Post('login')
  login(@Body() datos: LoginDto) {
    return this.authService.login(datos);
  }

  @Publico()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() datos: RefreshDto) {
    return this.authService.refresh(datos.refreshToken);
  }

  @Get('perfil')
  perfil(@UsuarioActual() usuario: Usuario) {
    return this.authService.perfil(usuario);
  }
}
