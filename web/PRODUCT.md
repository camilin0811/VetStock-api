# Product

<!-- impeccable:product-schema 1 -->

<!-- Inferido del encargo y del plan (sin entrevista: ejecucion por subagente). Supuestos marcados. -->

## Platform

web

## Stack

Vite + React + TypeScript (indicado en el encargo).

## Users

Equipo de una clinica veterinaria: farmaceutico (inventario y lotes), veterinario (dispensa a pacientes) y administrador (usuarios). Uso diario en escritorio y en movil dentro de la clinica.

## Product Purpose

Controlar existencias, lotes y vencimientos de medicamentos, dispensar con FEFO y evitar quiebres de stock o perdidas por vencimiento.

## Positioning

Inventario veterinario con dispensacion FEFO, kardex y alertas de vencimiento, con tono amable y no corporativo.

## Capabilities and Constraints

API NestJS segun contrato (JWT access + refresh, roles admin/veterinario/farmaceutico). Copia de interfaz en espanol. Supuesto: escritura de catalogo/lotes para admin y farmaceutico; veterinario dispensa; anular dispensacion admin y farmaceutico.

## Brand Commitments

Marca "VetStock". Estilo inspirado en un dashboard de mascotas (lavanda, tarjetas blancas de radio grande), sin copiar su nombre ni marca.

## Product Principles

1. La tarea (dispensar, registrar un lote) debe estar a un toque desde el inicio.
2. El estado del inventario se lee de un vistazo, con color y texto, nunca solo color.
3. Los errores de la API se muestran tal cual llegan y dicen que hacer.
