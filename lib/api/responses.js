import { NextResponse } from 'next/server';

export function ok(data, init) {
  return NextResponse.json(data, { status: 200, ...(init || {}) });
}

export function created(data, init) {
  return NextResponse.json(data, { status: 201, ...(init || {}) });
}

export function badRequest(message = 'Bad Request', details) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status: 400 });
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = 'Not Found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message = 'Conflict') {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function gone(message = 'Gone') {
  return NextResponse.json({ error: message }, { status: 410 });
}

export function tooManyRequests(message = 'Too Many Requests') {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = 'Internal Server Error') {
  return NextResponse.json({ error: message }, { status: 500 });
}
