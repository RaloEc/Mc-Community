'use client'

import React from 'react'
import ComentariosNuevo from '../ComentariosNuevo'

const CommentDemo: React.FC = () => {
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-8 text-gray-800 dark:text-gray-200">
          Sistema de Comentarios
        </h1>
        <ComentariosNuevo contentType="noticia" contentId="demo-content-id" />
      </main>
    </div>
  )
}

export default CommentDemo
