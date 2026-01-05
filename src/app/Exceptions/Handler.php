protected function unauthenticated($request, AuthenticationException $exception)
{
    return $request->expectsJson()
        ? response()->json(['message' => 'Unauthenticated.'], 401)
        : redirect()->guest(route('login'));
}