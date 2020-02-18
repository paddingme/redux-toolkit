import { EntityStateAdapter, EntityState, Update } from './models'
import { createEntityAdapter } from './create_adapter'
import { createAction } from '../createAction'
import {
  BookModel,
  TheGreatGatsby,
  AClockworkOrange,
  AnimalFarm
} from './fixtures/book'

describe('Sorted State Adapter', () => {
  let adapter: EntityStateAdapter<BookModel>
  let state: EntityState<BookModel>

  beforeAll(() => {
    //eslint-disable-next-line
    Object.defineProperty(Array.prototype, 'unwantedField', {
      enumerable: true,
      configurable: true,
      value: 'This should not appear anywhere'
    })
  })

  afterAll(() => {
    delete (Array.prototype as any).unwantedField
  })

  beforeEach(() => {
    adapter = createEntityAdapter({
      selectId: (book: BookModel) => book.id,
      sortComparer: (a, b) => {
        //console.log(`${a.title}, ${b.title}`)
        return a.title.localeCompare(b.title)
      }
    })

    state = { ids: [], entities: {} }
  })

  it('should let you add one entity to the state', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should let you add one entity to the state as an FSA', () => {
    const bookAction = createAction<BookModel>('books/add')
    const withOneEntity = adapter.addOne(state, bookAction(TheGreatGatsby))

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should not change state if you attempt to re-add an entity', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const readded = adapter.addOne(withOneEntity, TheGreatGatsby)

    expect(readded).toBe(withOneEntity)
  })

  it('should let you add many entities to the state', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withManyMore = adapter.addMany(withOneEntity, [
      AClockworkOrange,
      AnimalFarm
    ])

    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby,
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should remove existing and add new ones on setAll', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withAll = adapter.setAll(withOneEntity, [
      AClockworkOrange,
      AnimalFarm
    ])

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should remove existing and add new ones on addAll (deprecated)', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withAll = adapter.setAll(withOneEntity, [
      AClockworkOrange,
      AnimalFarm
    ])

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you add remove an entity from the state', () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby)

    const withoutOne = adapter.removeOne(state, TheGreatGatsby.id)

    expect(withoutOne).toEqual({
      ids: [],
      entities: {}
    })
  })

  it('should let you remove many entities by id from the state', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])

    const withoutMany = adapter.removeMany(withAll, [
      TheGreatGatsby.id,
      AClockworkOrange.id
    ])

    expect(withoutMany).toEqual({
      ids: [AnimalFarm.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you remove all entities from the state', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])

    const withoutAll = adapter.removeAll(withAll)

    expect(withoutAll).toEqual({
      ids: [],
      entities: {}
    })
  })

  it('should let you update an entity in the state', () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: 'A New Hope' }

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes
        }
      }
    })
  })

  it('should not change state if you attempt to update an entity that has not been added', () => {
    const withUpdates = adapter.updateOne(state, {
      id: TheGreatGatsby.id,
      changes: { title: 'A New Title' }
    })

    expect(withUpdates).toBe(state)
  })

  it('should not change ids state if you attempt to update an entity that does not impact sorting', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])
    const changes = { title: 'The Great Gatsby II' }

    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withAll.ids).toBe(withUpdates.ids)
  })

  it('should let you update the id of entity', () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { id: 'A New Id' }

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [changes.id],
      entities: {
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes
        }
      }
    })
  })

  it('should resort correctly if same id but sort key update', () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AnimalFarm,
      AClockworkOrange
    ])
    const changes = { title: 'A New Hope' }

    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes
        },
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should resort correctly if the id and sort key update', () => {
    const withOne = adapter.setAll(state, [
      TheGreatGatsby,
      AnimalFarm,
      AClockworkOrange
    ])
    const changes = { id: 'A New Id', title: 'A New Hope' }

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes
    })

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, changes.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: AClockworkOrange,
        [changes.id]: {
          ...TheGreatGatsby,
          ...changes
        },
        [AnimalFarm.id]: AnimalFarm
      }
    })
  })

  it('should let you update many entities by id in the state', () => {
    const firstChange = { title: 'Zack' }
    const secondChange = { title: 'Aaron' }
    const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange])

    const withUpdates = adapter.updateMany(withMany, [
      { id: TheGreatGatsby.id, changes: firstChange },
      { id: AClockworkOrange.id, changes: secondChange }
    ])

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange
        },
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange
        }
      }
    })
  })

  it('should let you map over entities in the state', () => {
    const firstChange = { ...TheGreatGatsby, title: 'First change' }
    const secondChange = { ...AClockworkOrange, title: 'Second change' }

    const withMany = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm
    ])

    const withUpdates = adapter.map(withMany, book =>
      book.title === TheGreatGatsby.title
        ? firstChange
        : book.title === AClockworkOrange.title
        ? secondChange
        : book
    )

    expect(withUpdates).toEqual({
      ids: [AnimalFarm.id, TheGreatGatsby.id, AClockworkOrange.id],
      entities: {
        [AnimalFarm.id]: AnimalFarm,
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange
        },
        [AClockworkOrange.id]: {
          ...AClockworkOrange,
          ...secondChange
        }
      }
    })
  })

  it('should let you add one entity to the state with upsert()', () => {
    const withOneEntity = adapter.upsertOne(state, TheGreatGatsby)
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: TheGreatGatsby
      }
    })
  })

  it('should let you update an entity in the state with upsert()', () => {
    const withOne = adapter.addOne(state, TheGreatGatsby)
    const changes = { title: 'A New Hope' }

    const withUpdates = adapter.upsertOne(withOne, {
      ...TheGreatGatsby,
      ...changes
    })
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...changes
        }
      }
    })
  })

  it('should let you upsert many entities in the state', () => {
    const firstChange = { title: 'Zack' }
    const withMany = adapter.setAll(state, [TheGreatGatsby])

    const withUpserts = adapter.upsertMany(withMany, [
      { ...TheGreatGatsby, ...firstChange },
      AClockworkOrange
    ])

    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          ...TheGreatGatsby,
          ...firstChange
        },
        [AClockworkOrange.id]: AClockworkOrange
      }
    })
  })
})