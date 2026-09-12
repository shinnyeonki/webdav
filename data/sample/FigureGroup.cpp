#include "FigureGroup.h"

FigureGroup::FigureGroup() {}

void FigureGroup::draw(HDC dc)
{
	//MyList<Figure>::MIterator i;
	for (auto i : groupFg)
	{
		(i)->draw(dc);
	}
}

void FigureGroup::setSize()
{
	start_.x_ = start_.y_ = INT_MAX;
	end_.x_ = end_.y_ = INT_MIN;
	//MyList<Figure>::MIterator i;
	for (auto i : groupFg)
	{
		if ((i)->getStart().x_ < this->start_.x_)
			this->start_.x_ = (i)->getStart().x_;
		if ((i)->getStart().y_ < this->start_.y_)
			this->start_.y_ = (i)->getStart().y_;
		if ((i)->getEnd().x_ > this->end_.x_)
			this->end_.x_ = (i)->getEnd().x_;
		if ((i)->getEnd().y_ > this->end_.y_)
			this->end_.y_ = (i)->getEnd().y_;
	}
}

void FigureGroup::push(Figure *f)
{
	groupFg.push_back(f);
}

void FigureGroup::move(int x, int y)
{
	Figure::move(x, y);
	//MyList<Figure>::MIterator i;
	for (auto i : groupFg)
	{
		(i)->move(x,y);
	}
}